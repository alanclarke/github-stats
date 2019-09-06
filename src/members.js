const _ = require('lodash')
const axios = require('./axios')
const createDB = require('./db')
const cursorDB = createDB('cursors')

module.exports = async function getMembers (organisation, team, { fresh }) {
  const key = [organisation, team].join('.')
  const membersDB = createDB(key)
  let cursor, members
  if (fresh) {
    await cursorDB.del(key)
    await membersDB.del(key)
  }
  cursor = await cursorDB.get(key)
  members = await membersDB.get(key)
  const { members: newMembers, cursor: newCursor } = await crawlMembers(organisation, team, members, cursor)
  await cursorDB.put(key, newCursor)
  await membersDB.put(key, newMembers)
  return newMembers

  async function crawlMembers (members = [], cursor = false) {
    console.log(`fetching ${key}`)
    const { data } = await axios.post(`https://api.github.com/graphql`, {
      variables: {
        organisation,
        team
      },
      query: `
        query($organisation:String!, $team:String!) {
          organization(login: $organisation) {
            team(slug: $team) {
              members(
                first:100,
                orderBy: { field: CREATED_AT, direction: DESC }
                ${cursor ? `after: "${cursor}"` : ''}) {
                edges {
                  node {
                    login
                  }
                  cursor
                }
              }
            }
          }
        }
      `
    })
    const errors = _.get(data, 'data.errors')
    if (errors) throw new Error(errors)
    const edges = _.get(data, 'data.organization.team.members.edges')
    if (edges.length) {
      const newCursor = _.last(edges).cursor
      const newMembers = members.concat(edges.map(e => e.node.login))
      return crawlMembers(newMembers, newCursor)
    } else {
      return { members, cursor }
    }
  }
}
