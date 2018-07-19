#!/usr/bin/env node
const path = require('path')

require('yargs')
  .usage('$0 <cmd> [args]')
  .command('tail', '- Long tailing output of selected log groups', (yargs) => {
    yargs.option('group-name', {
      alias: 'name',
      type: 'string',
      describe: 'filter log groups with regex or string. E.g. /*lambda*/, \'lambda\''
    })
    yargs.positional('include', {
      type: 'string',
      describe: 'configuration of AWS credentials and region in [PROFILE:REGION] format. E.g. default:ap-southeast-1'
    }).coerce('include', val => {
      const { ArgumentsError } = require('../lib/Errors')
      const checkValue = (v) => {
        if (!v || (v.split(':').length !== 2 && v.split('::').length !== 2)) {
          throw new ArgumentsError('Invalid argument [include]')
        }
      }
      if (val instanceof Array) {
        val.map(v => {
          checkValue(v)
          return v.replace('::', ':')
        })
        return val
      } else {
        checkValue(val)
        return [val.replace('::', ':')]
      }
    })
    yargs.demandOption(['include'], 'Missing arguments, check help for more detail')
  }, (argv) => {
    const filePath = path.resolve(__dirname, '../index.js')
    const { groupName, include } = argv
    require(filePath).tail({ groupName, include })
  })
  .help()
  .argv