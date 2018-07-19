const AWS = require('aws-sdk')
const LogGroup = require('./LogGroup')
const util = require('util')
const { InvalidCredentialsError, ConfigurationError } = require('./Errors')

class GroupManager {
  constructor (configurations) {
    // get a list of configurations based on region and profile
    this.configMappings = configurations.reduce((mappings, config) => {
      if (!config.profile) { throw new ConfigurationError(`Profile is missing [raw=${JSON.stringify(config)}]`) }
      if (!config.region) { throw new ConfigurationError(`Region is missing [raw=${JSON.stringify(config)}]`) }

      const key = `${config.profile}:${config.region}`
      mappings[key] = Object.assign({ key }, config)
      return mappings
    }, {})
  }

  async groups () {
    if (Object.keys(this.configMappings).length <= 0) { return [] }

    const groupMappings = {}
    for (let key in this.configMappings) {
      const config = this.configMappings[key]
      let credentials
      try {
        credentials = new AWS.SharedIniFileCredentials({ profile: config.profile })
      } catch (e) {
        throw new InvalidCredentialsError(`Invalid credentials of ${config.profile}`)
      }
      const cloudWatch = new AWS.CloudWatchLogs({ credentials, region: config.region })
      const describeLogGroups = util.promisify(cloudWatch.describeLogGroups)

      let nextToken
      let retryCount = 0
      while (nextToken !== null && retryCount < 5) {
        const params = {
          limit: 50,
          nextToken: nextToken
        }
        if (config.logGroupNamePrefix) { params.logGroupNamePrefix = config.logGroupNamePrefix }
        try {
          const result = await describeLogGroups.call(cloudWatch, params)
          result.logGroups.forEach(group => {
            const id = `${config.profile}:${config.region}:${group.logGroupName}`
            groupMappings[id] = Object.assign({
              id,
              cloudWatch,
              config,
              group
            })
          })
          nextToken = result.nextToken || null
        } catch (e) {
          console.error(e)
          retryCount++
        }
      }
    }

    return groupMappings
  }

  async tail (logGroups) {
    logGroups.forEach(logGroup => {
      const credentials = new AWS.SharedIniFileCredentials({ profile: logGroup.config.profile })
      const payload = {
        cloudWatch: new AWS.CloudWatchLogs({ credentials, region: logGroup.config.region }),
        group: logGroup.group
      }
      const group = new LogGroup(payload)
      group.tail()
    })
  }
}

module.exports = GroupManager
