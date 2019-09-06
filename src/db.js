const _ = require('lodash')
const level = require('level')
const path = require('path')
const { DB_PATH } = require('./constants')

module.exports = _.memoize(function createDB (name) {
  const db = level(path.join(DB_PATH, name + '.level'))

  return {
    db,
    get,
    put,
    del,
    putAll,
    getAll,
    delAll
  }

  async function get (key) {
    try {
      return JSON.parse(await db.get(key))
    } catch (err) {
      if (err.notFound) return
      throw err
    }
  }

  async function del (key) {
    return db.del(key)
  }

  async function put (key, value) {
    return db.put(key, JSON.stringify(value))
  }

  async function putAll (obj) {
    return db.batch(_.map(obj, (val, key) => {
      return {
        type: 'put',
        key: key,
        value: JSON.stringify(val)
      }
    }))
  }

  async function delAll () {
    const all = await getAll()
    return db.batch(_.map(all, (val, key) => {
      return {
        type: 'del',
        key: key
      }
    }))
  }

  async function getAll () {
    const obj = {}
    return new Promise((resolve, reject) => {
      db.createReadStream()
        .on('data', function ({ key, value }) {
          obj[key] = JSON.parse(value)
        })
        .on('error', reject)
        .on('end', () => resolve(obj))
    })
  }
})
