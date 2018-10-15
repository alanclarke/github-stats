#!/usr/bin/env node
// pr titles by repo with optional commit messages
// number of prs, number of commits, average additions and deletions per pr
const _ = require('lodash')
const getMembers = require('../src/members')
const getSummary = require('../src/summary')
const getPrs = require('../src/prs')
const pMap = require('p-map')
const meow = require('meow')
const cli = meow(
  `
github prs user[s] --commits
github summary user[s]
`,
  {
    flags: {
      user: { type: 'string', alias: 'u' },
      from: { type: 'string', alias: 'f' },
      to: { type: 'string', alias: 't' },
      commits: { type: 'boolean', default: false }
    }
  }
)

;(async () => {
  const { user, from, to, commits } = cli.flags
  const members = user ? user.split(/[\s,]+/gi) : await getMembers('qubitdigital', 'eng')
  let results
  switch (cli.input[0]) {
    case 'summary':
      results = await pMap(members, member => getSummary(member, from, to, { commits }), {
        concurrency: 1
      })
      console.log(_.orderBy(results, r => r.prs, 'desc'))
      break
    case 'prs':
      results = await pMap(members, member => getPrs(members, from, to, { commits }), {
        concurrency: 1
      })
      console.log(_.orderBy(results, r => r.prs, 'desc'))
      break
    default: console.log(cli)
  }
})()
