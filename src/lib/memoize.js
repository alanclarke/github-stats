const path = require('path')
const createCache = require('./cache')
const cache = createCache(path.join(__dirname, '../../.cache'))

module.exports = function memoize (fn, getKey) {
  return async (...args) => {
    const key = getKey(...args)
    let value = await cache.get(key)
    if (value !== void 0) return value
    value = await fn(...args)
    await cache.set(key, value)
    return value
  }
}
