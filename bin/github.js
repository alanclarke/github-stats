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
github prs --users user --commits
github summary --users user
github members organisation
`,
  {
    flags: {
      users: { type: 'string', alias: 'u' },
      start: { type: 'string', alias: 's', default: false },
      end: { type: 'string', alias: 'e', default: false },
      fresh: { type: 'boolean', alias: 'f', default: false },
      commits: { type: 'boolean', alias: 'c', default: false },
      owners: { type: 'string', alias: 'o', default: false },
      team: { type: 'string', alias: 't', default: false }
    }
  }
)

;(async () => {
  let { users, start, end, fresh, commits, owners, team } = cli.flags
  let results
  if (users && !Array.isArray(users)) users = [users]
  if (owners && !Array.isArray(owners)) owners = [owners]
  const options = { fresh, commits, start, end, owners }
  switch (cli.input[0]) {
    case 'members':
      const members = await getMembers(cli.input[1], team, { fresh })
      console.log(members)
      break
    case 'summary':
      results = await pMap(users, member => getSummary(member, options), {
        concurrency: 1
      })
      console.log(JSON.stringify(_.orderBy(results, r => r.prs, 'desc'), null, 2))
      break
    case 'prs':
      results = await pMap(users, member => getPrs(member, options), {
        concurrency: 1
      })
      console.log(JSON.stringify(results, null, 2))
      break
    case 'text':
      results = await pMap(users, member => getText(member, options), {
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
