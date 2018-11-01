const _ = require('lodash')
const getBreakdown = require('./lib/breakdown')

module.exports = async function prs (username, start, end, options = {}) {
  const breakdown = await getBreakdown(username, start, end, options)
  return _.mapValues(breakdown, edges => edges.map(e => e))
}
