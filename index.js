const _ = require('lodash')
const pMap = require('p-map')
// const getMembers = require('./lib/members')
const prs = require('./lib/prs')

;(async () => {
  // const members = await getMembers('qubitdigital', 'eng')
  const members = ['buggyvelarde']
  const results = await pMap(members, member => prs(member, '2015-08-01', '2018-09-30'), {
    concurrency: 1
  })
  console.log(_.orderBy(results, r => r.prs, 'desc'))
})()
