const config = require('config')
const Axios = require('axios')

module.exports = Axios.create({
  headers: {
    Authorization: `bearer ${config.token}`
  }
})
