const _ = require('lodash')
const axios = require('./axios')
const delay = require('./delay')
const retry = require('./retry')
const createDB = require('./db')

module.exports = async function getPRHistory (username, { fresh }) {
  const cursorDB = await createDB('cursors')
  const historyDB = await createDB(username)
  if (fresh) {
    await cursorDB.delAll(username)
    await historyDB.delAll(username)
  }
  const cursor = await cursorDB.get(username)
  const history = _.values(await historyDB.getAll())
  const { history: newHistory, cursor: newCursor } = await crawlPRHistory(
    history,
    cursor
  )
  await cursorDB.put(username, newCursor)
  await historyDB.putAll(_.keyBy(newHistory, 'cursor'))
  return newHistory

  async function crawlPRHistory (history = [], cursor = false) {
    console.log(`fetching ${username}`)
    try {
      const { data } = await retry(() =>
        axios.post('https://api.github.com/graphql', {
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
                      owner {
                        login
                      }
                    }
                  }
                  cursor
                }
              }
            }
          }
        `
        })
      )
      const errors = _.get(data, 'data.errors')
      if (errors) throw new Error(errors)
      const edges = _.get(data, 'data.user.pullRequests.edges')
      if (edges.length) {
        const newCursor = _.last(edges).cursor
        const newHistory = history.concat(edges)
        await delay('1s')
        return crawlPRHistory(newHistory, newCursor)
      } else {
        return { history, cursor }
      }
    } catch (err) {
      await delay('2s')
      console.log(err.response || err)
      return crawlPRHistory(history, cursor)
    }
  }
}
