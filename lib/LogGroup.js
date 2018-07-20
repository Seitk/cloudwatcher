const chalk = require('chalk');
const util = require('util');
const Message = require('./Message');
const continueWithInternal = require('./modules/continueWithInternal');

class LogGroup {
  constructor(payload) {
    this.cloudWatch = payload.cloudWatch;
    this.group = payload.group;
    this.filterLogEvents = util.promisify(this.cloudWatch.filterLogEvents);
  }

  async tail(options = {}) {
    const tailOptions = { ...options };
    if (tailOptions.pollingInterval === undefined) {
      tailOptions.pollingInterval = 2000;
    }
    if (tailOptions.startTime === undefined) {
      tailOptions.startTime = Date.now();
    }

    const params = {
      logGroupName: this.group.logGroupName,
      interleaved: false,
    };
    if (tailOptions.pollingInterval) {
      params.startTime = tailOptions.startTime;
    }

    this.filterLogEvents
      .call(this.cloudWatch, params)
      .then((res) => {
        let { startTime } = tailOptions;
        res.events.forEach((event) => {
          const message = new Message(event);
          if (message.isReadable) {
            message.print();
          }
          startTime = Math.max(event.timestamp + 1, startTime);
        });

        if (tailOptions.pollingInterval) {
          return continueWithInternal(this, tailOptions, startTime);
        }
        return null;
      })
      .catch((e) => {
        console.error(chalk.red(`!! Failed to get output from ${this.group.logGroupName}`));
        console.error(e);
      });
  }
}

module.exports = LogGroup;
