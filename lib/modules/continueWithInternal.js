// Called by LogGroup to continue tailing on next segment
module.exports = (logGroup, options = {}, startTime) => {
  let fetchStartTime = startTime;
  if (fetchStartTime === undefined) {
    fetchStartTime = Date.now();
  }
  setTimeout(() => {
    logGroup.tail(Object.assign({}, options, {
      startTime: fetchStartTime,
    }));
  }, options.pollingInterval);
};
