const _ = require('lodash')
const getBreakdown = require('./breakdown')
const stats = require('statsjs')

module.exports = async function summary (username, start, end, options = {}) {
  let prs = _.map(await getBreakdown(username, options), 'node')
  if (end) prs = prs.filter(pr => pr.createdAt < end)
  if (start) prs = prs.filter(pr => pr.createdAt > start)
  const byRepo = _.groupBy(prs, 'repository.name')
  return {
    username,
    prs: prs.length,
    repos: Object.keys(byRepo).length,
    totalCommits: _.sum(prs.map(pr => {
      return pr.commits.edges.length
    })),
    totalAdditions: _.sum(prs.map(pr => pr.additions)),
    totalDeletions: _.sum(prs.map(pr => pr.deletions)),
    avgCommits: stats(prs.map(pr => pr.commits.edges.length)).removeOutliers().mean().toFixed(2),
    avgAdditions: stats(prs.map(pr => pr.additions)).removeOutliers().mean().toFixed(2),
    avgDeletions: stats(prs.map(pr => pr.deletions)).removeOutliers().mean().toFixed(2)
  }
}
