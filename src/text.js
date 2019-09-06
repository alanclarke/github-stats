const _ = require('lodash')
const getBreakdown = require('./breakdown')

module.exports = async function prs (username, start, end, options = { }) {
  let prs = _.map(await getBreakdown(username, options), 'node')
  return _.flatten(_.map(prs, pr => {
    if (options.commits) return pr.commits.edges.map(commit => commit.node.commit.message)
    return pr.title
  }))
}
