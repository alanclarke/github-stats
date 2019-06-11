#!/usr/bin/env node
// pr titles by repo with optional commit messages
// number of prs, number of commits, average additions and deletions per pr
const _ = require('lodash')
const getMembers = require('../src/members')
const getSummary = require('../src/summary')
const getPrs = require('../src/prs')
const getText = require('../src/text')
const pMap = require('p-map')
const meow = require('meow')
const cli = meow(
  `
github prs --user user[s] --commits
github summary --user user[s]
`,
  {
    flags: {
      user: { type: 'string', alias: 'u' },
      start: { type: 'string', alias: 's' },
      end: { type: 'string', alias: 'e' },
      fresh: { type: 'boolean', alias: 'f', default: false },
      commits: { type: 'boolean', default: false }
    }
  }
)

;(async () => {
  const { user, start, end, fresh, commits } = cli.flags
  const members = user ? user.split(/[\s,]+/gi) : await getMembers('qubitdigital', 'eng')
  let results
  switch (cli.input[0]) {
    case 'summary':
      results = await pMap(members, member => getSummary(member, start, end, { fresh, commits }), {
        concurrency: 1
      })
      console.log(JSON.stringify(_.orderBy(results, r => r.prs, 'desc'), null, 2))
      break
    case 'prs':
      results = await pMap(members, member => getPrs(member, start, end, { fresh, commits }), {
        concurrency: 1
      })
      console.log(JSON.stringify(results, null, 2))
      break
    case 'text':
      results = await pMap(members, member => getText(member, start, end, { fresh, commits }), {
        concurrency: 1
      })
      results.forEach(userMessages => userMessages.forEach(msg => console.log(msg)))
      break
    default: console.log(cli)
  }
})()
