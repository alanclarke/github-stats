const _ = require('lodash')
const axios = require('./axios')
const delay = require('./delay')
const retry = require('./retry')
const createDB = require('./db')
const cursorDB = createDB('cursors')

module.exports = async function getPRHistory (username, { fresh }) {
  const historyDB = createDB(username)
  let cursor, history
  if (fresh) {
    await cursorDB.del(username)
    await historyDB.delAll(username)
  }
  cursor = await cursorDB.get(username)
  history = _.values(await historyDB.getAll())
  const { history: newHistory, cursor: newCursor } = await crawlPRHistory(history, cursor)
  await cursorDB.put(username, newCursor)
  await historyDB.putAll(_.keyBy(newHistory, 'cursor'))
  return newHistory

  async function crawlPRHistory (history = [], cursor = false) {
    console.log(`fetching ${username}`)
    const { data } = await retry(() => axios.post(`https://api.github.com/graphql`, {
      variables: {
        username: username
      },
      query: `
        query ($username:String!) {
          user(login: $username) {
            pullRequests(
              ${cursor ? `after: "${cursor}"` : ''}
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
    }))
    const errors = _.get(data, 'data.errors')
    if (errors) throw new Error(errors)
    const edges = _.get(data, 'data.user.pullRequests.edges')
    if (edges.length) {
      const newCursor = _.last(edges).cursor
      const newHistory = history.concat(edges)
      await delay('2s')
      return crawlPRHistory(newHistory, newCursor)
    } else {
      return { history, cursor }
    }
  }
}
