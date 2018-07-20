const chalk = require('chalk');

const isLambdaSystemLogs = text => text.match(/(START|END|REPORT) RequestId/);

class Message {
  constructor(event) {
    this.event = event;
  }

  print() {
    if (!this.isReadable) {
      return '';
    }
    return console.log(this.format());
  }

  format() {
    const messages = this.event.message
      .replace(/(^\n|\n$)/g, '')
      .split('\t')
      .splice(2);
    return `${chalk.green(this.createdAt)}   ${messages.join(' ')}`;
  }

  get isReadable() {
    return !!this.event.message && !isLambdaSystemLogs(this.event.message);
  }

  get createdAt() {
    const formatted = new Date(this.event.timestamp)
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '');
    return formatted;
  }
}

module.exports = Message;
