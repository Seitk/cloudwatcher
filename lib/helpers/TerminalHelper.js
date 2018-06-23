class TerminalHelper {
  static reset() {
    process.stdout.write('\x1Bc')
  }
}

module.exports = TerminalHelper