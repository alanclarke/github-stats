module.exports = async function retry (fn, times) {
  times = times || 1
  let err
  while (times--) {
    try {
      let result = await fn()
      return result
    } catch (error) {
      err = error
    }
  }
  throw err
}
