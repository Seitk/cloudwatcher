const chalk = require('chalk')

const isLambdaSystemLogs = (text) => {
  return text.match(/(START|END|REPORT) RequestId/)
}

class Message {
  constructor(event) {
    this._event = event
  }

  print() {
    if (!this.isReadable) { return '' }
    console.log(this.format())
  }

  format() {
    const [ datetime, requestId, ...messages ] = this._event.message.replace(/(^\n|\n$)/g, '').split('\t')
    return `${chalk.green(this.createdAt)}   ${messages.join(' ')}`
  }

  get isReadable() {
    return !!this._event.message && !isLambdaSystemLogs(this._event.message)
  }

  get createdAt() {
    const formatted = new Date(this._event.timestamp).toISOString().replace(/T/, ' ').replace(/\..+/, '')
    return formatted
  }
}

module.exports = Message