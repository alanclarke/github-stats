const axios = require('./lib/axios')

module.exports = async function getMembers (organisation, team) {
  const { data } = await axios.post(`https://api.github.com/graphql`, {
    variables: {
      organisation: 'qubitdigital',
      team
    },
    query: `
      query($organisation:String!, $team:String!) {
        organization(login: $organisation) {
          team(slug: $team) {
            members(first:100) {
              edges {
                node {
                  login
                }
              }
            }
          }
        }
      }
    `
  })

  return data.data.organization.team.members.edges.map(e => e.node.login)
}
