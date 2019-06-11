const _ = require('lodash')
const getBreakdown = require('./lib/breakdown')

module.exports = async function prs (username, start, end, options = { }) {
  const breakdown = await getBreakdown(username, start, end, options)
  return _.chain(breakdown)
    .values()
    .flatten()
    .map(e => {
      if (options.commits) return e.commits.edges.map(e => e.node.commit.message)
      return [e.title]
    })
    .flatten()
    .value()
}
