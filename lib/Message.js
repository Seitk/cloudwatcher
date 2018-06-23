const REQUEST_START_INDICATOR = 'START RequestId'
const chalk = require('chalk')

class Message {
  constructor(event) {
    this._event = event
  }

  print() {
    if (!this.isReadable) { return '' }
    console.log(this.format())
  }

  format() {
    const [ datetime, requestId, message ] = this._event.message.replace(/(^\n|\n$)/g, '').split('\t')
    return `${chalk.green(this.createdAt)}   ${message}`
  }

  get isReadable() {
    return !!this._event.message && this._event.message.indexOf(REQUEST_START_INDICATOR) < 0
  }

  get createdAt() {
    const formatted = new Date(this._event.timestamp).toISOString().replace(/T/, ' ').replace(/\..+/, '')
    return formatted
  }
}

module.exports = Message