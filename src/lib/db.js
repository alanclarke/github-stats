const path = require('path')
const createCache = require('./cache')

module.exports = createCache(path.join(__dirname, '../../.cache'))
