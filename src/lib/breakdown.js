const _ = require('lodash')
const axios = require('./axios')
const retry = require('./retry')
const db = require('./db')
const ms = require('ms')
const memoize = require('./memoize')
const cacheKey = (username, after) => `${username}:${after || ''}`
const getPageMemoized = memoize(getPage, cacheKey)

module.exports = async function breakdown (username, start, end, { fresh }) {
  let edges = (await next(username, start, fresh))
  if (end) edges = edges.filter(e => e.node.createdAt < end)
  if (start) edges = edges.filter(e => e.node.createdAt > start)
  return _.groupBy(edges.map(e => e.node), node => node.repository.name)
}

async function next (username, start, fresh, edges = []) {
  let after
  if (edges.length && _.last(edges).cursor) after = _.last(edges).cursor
  if (fresh) await db.unset(cacheKey(username, after))
  const data = await getPageMemoized(username, after)
  const newEdges = _.get(data, 'user.pullRequests.edges')
  if (newEdges && newEdges.length) {
    edges = edges.concat(newEdges)
    if (start && edges.length && _.last(edges).node.createdAt > start) return next(username, start, fresh, edges)
  }
  return edges
}

async function getPage (username, after) {
  console.log('fetching data for ' + username)
  if (after) await delay(ms('2s'))
  const { data } = await retry(() => axios.post(`https://api.github.com/graphql`, {
    variables: {
      username: username
    },
    query: `
      query ($username:String!) {
        user(login: $username) {
          pullRequests(
            ${after ? `after: "${after}"` : ''}
            first: 100,
            states: MERGED,
            orderBy: {field: CREATED_AT, direction: DESC}
          ) {
            totalCount
            edges {
              node {
                createdAt
                title
                url
                additions
                deletions
                commits(first:250) {
                  edges {
                    node {
                      commit {
                        message
                      }
                    }
                  }
                }
                repository {
                  name
                  url
                }
              }
              cursor
            }
          }
        }
      }
    `
  }), 5).catch(err => {
    console.log(err.response)
    throw err
  })
  if (data.errors) throw data.errors
  return data.data
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
