const inquirer = require('inquirer');
const GroupManager = require('./lib/GroupManager')
const TerminalHelper = require('./lib/helpers/TerminalHelper')
const { NotFoundError } = require('./lib/Errors')

module.exports = {
  tail: (options={}) => {
    const manager = new GroupManager(options.include.map((include) => {
      const parts = include.split('::')
      return { profile: parts[0], region: parts[1] }
    }))
    console.log("Loading log groups...")

    manager
      .groups()
      .then(logGroups => {
        TerminalHelper.reset()

        const choices = Object.values(logGroups).reduce((array, logGroup) => {
          // new inquirer.Separator(' = The Meats = '),
          const choice = { name: logGroup.id, value: logGroup }
          if (options.groupName) {
            const regex = new RegExp(options.groupName.match(/^\/.*\/$/) ? options.groupName.replace(/(^\/|\/$)/g, '') : `.*${options.groupName}.*`)
            if (logGroup.id.match(regex)) { array.push(choice) }
          } else {
            array.push(choice)
          }
          return array
        }, [])

        if (choices.length <= 0) {  throw new NotFoundError('No log group available') }

        return inquirer
          .prompt([
            {
              pageSize: 30,
              type: 'checkbox',
              message: 'Select the log groups to tail',
              name: 'logGroups',
              choices: choices,
              validate: function(answer) {
                if (answer.length < 1) {
                  return 'You must choose at least one group';
                }
                return true;
              }
            }
          ])
      })
      .then(res => {
        manager.tail(res.logGroups)
      })
      .catch(e => {
        console.error("Error occurred")
        console.error(e)
      })
  }
}