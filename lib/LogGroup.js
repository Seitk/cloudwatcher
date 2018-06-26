const chalk = require('chalk')
const util = require('util')
const Message = require('./Message')
const continueWithInternal = require('./modules/continueWithInternal')

class LogGroup {
  constructor (payload) {
    this.cloudWatch = payload.cloudWatch
    this.group = payload.group
    this.filterLogEvents = util.promisify(this.cloudWatch.filterLogEvents)
  }

  async tail (options = {}) {
    if (options.pollingInterval === undefined) { options.pollingInterval = 2000 }
    if (options.startTime === undefined) { options.startTime = Date.now() }

    var params = {
      logGroupName: this.group.logGroupName,
      interleaved: false
    }
    if (options.pollingInterval) {
      params.startTime = options.startTime
    }

    this.filterLogEvents.call(this.cloudWatch, params)
      .then((res) => {
        let startTime = options.startTime
        res.events.forEach(event => {
          const message = new Message(event)
          if (message.isReadable) {
            message.print()
          }
          startTime = Math.max((event.timestamp + 1), startTime)
        })

        if (options.pollingInterval) {
          return continueWithInternal(this, options, startTime)
        }
      })
      .catch((e) => {
        console.error(chalk.red(`!! Failed to get output from ${this.group.logGroupName}`))
        console.error(e)
      })
  }
}

module.exports = LogGroup
