module.exports = async function retry (fn, times = 2) {
  times = times || 1
  let err
  while (times--) {
    try {
      return await fn()
    } catch (error) {
      err = error
    }
  }
  throw err
}
