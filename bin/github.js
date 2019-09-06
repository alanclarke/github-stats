#!/usr/bin/env node
// pr titles by repo with optional commit messages
// number of prs, number of commits, average additions and deletions per pr
const getMembers = require('../src/members')
const getSummary = require('../src/summary')
const getText = require('../src/text')
const getPrs = require('../src/prs')
const pMap = require('p-map')
const meow = require('meow')
const _ = require('lodash')
const cli = meow(
  `
github prs --user user[s] --commits
github summary --user user[s]
`,
  {
    flags: {
      user: { type: 'string', alias: 'u' },
      start: { type: 'string', alias: 's', default: false },
      end: { type: 'string', alias: 'e', default: false },
      fresh: { type: 'boolean', alias: 'f', default: false },
      commits: { type: 'boolean', alias: 'c', default: false },
      organization: { type: 'string', alias: 'o', default: false },
      team: { type: 'string', alias: 't', default: false }
    }
  }
)

;(async () => {
  const { user, start, end, fresh, commits, organization, team } = cli.flags
  let results, members
  switch (cli.input[0]) {
    case 'members':
      members = await getMembers(organization, team, { fresh })
      console.log(members)
      break
    case 'summary':
      members = user.split(/[\s,]+/gi)
      results = await pMap(members, member => getSummary(member, start, end, { fresh, commits }), {
        concurrency: 1
      })
      console.log(JSON.stringify(_.orderBy(results, r => r.prs, 'desc'), null, 2))
      break
    case 'prs':
      members = user.split(/[\s,]+/gi)
      results = await pMap(members, member => getPrs(member, start, end, { fresh, commits }), {
        concurrency: 1
      })
      console.log(JSON.stringify(results, null, 2))
      break
    case 'text':
      members = user.split(/[\s,]+/gi)
      results = await pMap(members, member => getText(member, start, end, { fresh, commits }), {
        concurrency: 1
      })
      results.forEach(userMessages => userMessages.forEach(msg => console.log(msg)))
      break
    default: console.log(cli)
  }
})().catch(err => {
  const axiosError = _.get(err, 'response.data.errors')
  if (axiosError) console.error(axiosError)
  throw err
})
