const path = require('path')
const fs = require('fs-extra')

module.exports = function createCache (dir) {
  const dbPath = path.join(dir, 'cache.json')

  async function getAll () {
    const str = await fs.readJson(dbPath).catch(e => false)
    return str || {}
  }

  async function get (key) {
    return (await getAll())[key]
  }

  async function set (key, value) {
    const all = await getAll()
    all[key] = value
    await fs.writeJson(dbPath, all)
  }

  return { get, set }
}
