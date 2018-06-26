// Called by LogGroup to continue tailing on next segment
module.exports = (logGroup, options = {}, startTime) => {
  if (startTime === undefined) { startTime = Date.now() }
  setTimeout(() => {
    logGroup.tail(Object.assign({}, options, {
      startTime
    }))
  }, options.pollingInterval)
}
