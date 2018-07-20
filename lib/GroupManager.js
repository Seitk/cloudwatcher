const AWS = require('aws-sdk');
const util = require('util');
const LogGroup = require('./LogGroup');
const { InvalidCredentialsError, ConfigurationError } = require('./Errors');
const Retryable = require('./helpers/Retryable');

class GroupManager {
  constructor(configurations) {
    // get a list of configurations based on region and profile
    this.configMappings = configurations.reduce((mappings, config) => {
      const updatedMappigns = { ...mappings };
      if (!config.profile) {
        throw new ConfigurationError(`Profile is missing [raw=${JSON.stringify(config)}]`);
      }
      if (!config.region) {
        throw new ConfigurationError(`Region is missing [raw=${JSON.stringify(config)}]`);
      }

      const key = `${config.profile}:${config.region}`;
      updatedMappigns[key] = Object.assign({ key }, config);
      return updatedMappigns;
    }, {});
  }

  async groups() {
    if (Object.keys(this.configMappings).length <= 0) {
      return [];
    }

    return new Promise((resolve) => {
      const configKeys = Object.keys(this.configMappings);
      const groupMappings = {};
      const promises = [];
      configKeys.forEach((key) => {
        const config = this.configMappings[key];
        const { profile, region, logGroupNamePrefix } = config;
        let credentials;
        try {
          credentials = new AWS.SharedIniFileCredentials({ profile });
        } catch (e) {
          throw new InvalidCredentialsError(`Invalid credentials of ${profile}`);
        }
        const cloudWatch = new AWS.CloudWatchLogs({ credentials, region });
        const describeLogGroups = util.promisify(cloudWatch.describeLogGroups);

        const promise = new Promise((r) => {
          let nextToken;

          Retryable.while(() => (nextToken !== null))
            .exec(async () => {
              const params = {
                limit: 50,
                nextToken,
              };
              if (logGroupNamePrefix) {
                params.logGroupNamePrefix = logGroupNamePrefix;
              }
              const result = await describeLogGroups.call(cloudWatch, params);
              result.logGroups.forEach((group) => {
                const id = `${profile}:${region}:${group.logGroupName}`;
                groupMappings[id] = Object.assign({
                  id,
                  cloudWatch,
                  config,
                  group,
                });
              });
              nextToken = result.nextToken || null;
            }).then(() => {
              r();
            });
        });
        promises.push(promise);
      });
      Promise.all(promises).then(() => {
        resolve(groupMappings);
      });
    });
  }

  static async tail(logGroups) {
    logGroups.forEach((logGroup) => {
      const credentials = new AWS.SharedIniFileCredentials({
        profile: logGroup.config.profile,
      });
      const payload = {
        cloudWatch: new AWS.CloudWatchLogs({
          credentials,
          region: logGroup.config.region,
        }),
        group: logGroup.group,
      };
      const group = new LogGroup(payload);
      group.tail();
    });
  }
}

module.exports = GroupManager;
