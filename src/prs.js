const _ = require('lodash')
const getBreakdown = require('./breakdown')

module.exports = async function prs (username, start, end, options = { }) {
  let prs = _.map(await getBreakdown(username, start, end, options), 'node')
  if (end) prs = prs.filter(pr => pr.createdAt < end)
  if (start) prs = prs.filter(pr => pr.createdAt > start)
  const byRepo = _.groupBy(prs, 'repository.name')
  return _.mapValues(byRepo, prs => prs.map(pr => {
    if (options.commits) {
      return {
        name: pr.title,
        commits: pr.commits.edges.map(commit => commit.node.commit.message)
      }
    }
    return pr.title
  }))
}
