const db = require('./db')

module.exports = function memoize (fn, getKey) {
  return async (...args) => {
    const key = getKey(...args)
    let value = await db.get(key)
    if (value !== void 0) return value
    value = await fn(...args)
    await db.set(key, value)
    return value
  }
}
