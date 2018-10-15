const _ = require('lodash')
const getBreakdown = require('./lib/breakdown')

module.exports = async function prs (username, from, until) {
  const breakdown = await getBreakdown(username, from, until)
  return _.mapValues(breakdown, edges => edges.map(e => e.title))
}
