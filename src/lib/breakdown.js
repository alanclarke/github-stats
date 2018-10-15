const _ = require('lodash')
const axios = require('./axios')
const retry = require('./retry')
const memoize = require('./memoize')

module.exports = async function breakdown (username, from, to) {
  let edges = (await next(username, from))
  if (to) edges = edges.filter(e => e.node.createdAt < to)
  return _.groupBy(edges.map(e => e.node), node => node.repository.name)
}

async function next (username, from, edges) {
  edges = edges || []
  let after
  if (edges.length && _.last(edges).cursor) after = _.last(edges).cursor
  const data = await getPage(username, after)
  const newEdges = _.get(data, 'user.pullRequests.edges')
  if (newEdges) {
    edges = edges.concat(newEdges)
    if (from && edges.length && _.last(edges).node.createdAt > from) return next(username, from, edges)
  }
  return edges
}

const getPage = memoize(async function getPage (username, after) {
  console.log('fetching data for ' + username)
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
                commits(first:100) {
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
}, (username, after) => `${username}:${after || ''}`)
