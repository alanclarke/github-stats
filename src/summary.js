const _ = require('lodash')
const getBreakdown = require('./lib/breakdown')
const stats = require('statsjs')

module.exports = async function summary (username, from, to, opts = {}) {
  const breakdown = await getBreakdown(username, from, to)
  const prs = _.flatten(_.values(breakdown))
  return {
    username,
    prs: prs.length,
    repos: Object.keys(breakdown).length,
    avgCommits: stats(prs.map(pr => pr.commits.edges.length)).removeOutliers().mean().toFixed(2),
    avgAdditions: stats(prs.map(pr => pr.additions)).removeOutliers().mean().toFixed(2),
    avgDeletions: stats(prs.map(pr => pr.deletions)).removeOutliers().mean().toFixed(2)
  }
}
