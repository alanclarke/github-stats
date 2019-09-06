const ms = require('ms')

module.exports = time => new Promise(resolve => setTimeout(resolve, ms(time)))
