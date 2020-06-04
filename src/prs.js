const _ = require('lodash')
const getBreakdown = require('./breakdown')

module.exports = async function prs (username, options = { }) {
  let prs = _.map(await getBreakdown(username, options), 'node')
  if (options.end) prs = prs.filter(pr => pr.createdAt < end)
  if (options.start) prs = prs.filter(pr => pr.createdAt > start)
  if (options.owners) prs = prs.filter(pr => {
    return options.owners.includes(pr.repository.owner.login)
  })
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
