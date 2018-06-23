jest.mock('aws-sdk')
jest.mock('util')
jest.mock(`${process.cwd()}/lib/LogGroup`)

const GroupManager = require(`${process.cwd()}/lib/GroupManager`)
const { ConfigurationError, InvalidCredentialsError } = require(`${process.cwd()}/lib/Errors`)

describe(`constructor`, () => {
  const groupManager = new GroupManager([
    { profile: 'profile-name-1', region: 'ap-southeast-1' },
    { profile: 'profile-name-2', region: 'ap-southeast-1' },
    { profile: 'profile-name-1', region: 'us-west-1' }
  ])
  const subject = groupManager.configMappings

  test(`checks given configurations`, async () => {
    expect(Object.keys(subject)).toEqual([
      'profile-name-1::ap-southeast-1',
      'profile-name-2::ap-southeast-1',
      'profile-name-1::us-west-1',
    ])
  })

  test(`creates a mappings with keys`, async () => {
    Object.values(subject).forEach(value => {
      expect(value).toHaveProperty('key')
    })
  })

  describe(`when profile or region is missing from any of the configuration`, () => {
    test(`throws ConfigurationError`, async () => {
      [{ region: 'ap-southeast-1' }, { profile: 'profile-name' }].forEach(config => {
        expect(() => { new GroupManager([config]) }).toThrow(ConfigurationError)
      })
    })
  })
})

describe(`groups`, () => {
  const util = require('util')
  util.promisify.mockImplementation((func) => (func))

  test(`returns an mappings of log groups and identifiers`, async () => {
    const AWS = require('aws-sdk')
    const describeLogGroups = jest.fn()
    describeLogGroups.call = jest.fn().mockImplementation((cloudwatch, params) => {
      const seedLogGroup = (i) => ({ logGroupName: `logGroup-${i}` })
      switch(params.nextToken) {
        case 'token-1':
          return Promise.resolve({ logGroups: [7, 8].map(seedLogGroup) })
      }
      switch(`${cloudwatch.config.credentials.profile}::${cloudwatch.config.region}`) {
        case 'profile-name-1::ap-southeast-1':
          return Promise.resolve({ logGroups: [1].map(seedLogGroup) })
        case 'profile-name-2::ap-southeast-1':
          return Promise.resolve({ logGroups: [2, 3, 4].map(seedLogGroup) })
        case 'profile-name-1::us-west-1':
          return Promise.resolve({ logGroups: [5, 6].map(seedLogGroup) })
      }
    })
    AWS.SharedIniFileCredentials = jest.fn().mockImplementation((options) => ({ profile: options.profile }))
    AWS.CloudWatchLogs = jest.fn().mockImplementation((config) => ({ describeLogGroups, config }))

    const configurations = [
      { profile: 'profile-name-1', region: 'ap-southeast-1' },
      { profile: 'profile-name-2', region: 'ap-southeast-1' },
      { profile: 'profile-name-1', region: 'us-west-1' }
    ]
    const groupManager = new GroupManager(configurations)
    const logGroups = await groupManager.groups()
    const ids = Object.values(logGroups).map(logGroup => (logGroup.group.logGroupName))
    expect(describeLogGroups.call).toHaveBeenCalledTimes(configurations.length)
    expect(ids).toEqual(['logGroup-1', 'logGroup-2', 'logGroup-3', 'logGroup-4', 'logGroup-5', 'logGroup-6'])
  })

  describe(`when log group prefix is given`, () => {
    test(`passes to request payload`, async () => {
      const AWS = require('aws-sdk')
      const describeLogGroups = jest.fn()
      describeLogGroups.call = jest.fn().mockImplementation((cloudwatch, params) => {
        return Promise.resolve({ logGroups: [] })
      })
      AWS.CloudWatchLogs = jest.fn().mockImplementation((config) => ({ describeLogGroups, config }))
      const prefix = 'log-group-prefix'
      const groupManager = new GroupManager([
        { profile: 'profile-name-1', region: 'ap-southeast-1', logGroupNamePrefix: prefix }
      ])
      const logGroups = await groupManager.groups()
      expect(describeLogGroups.call).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ logGroupNamePrefix: prefix }))
    })
  })

  describe(`when next token is returned from api`, () => {
    test(`gets more results with next token`, async () => {
      const AWS = require('aws-sdk')
      const describeLogGroups = jest.fn()
      describeLogGroups.call = jest.fn().mockImplementation((cloudwatch, params) => {
        const seedLogGroup = (i) => ({ logGroupName: `logGroup-${i}` })
        if (params.nextToken) {
          return Promise.resolve({ logGroups: [7, 8].map(seedLogGroup) })
        } else {
          return Promise.resolve({ logGroups: [1].map(seedLogGroup), nextToken: 'token-1' })
        }
      })
      AWS.CloudWatchLogs = jest.fn().mockImplementation((config) => ({ describeLogGroups, config }))
      const groupManager = new GroupManager([
        { profile: 'profile-name-1', region: 'ap-southeast-1' }
      ])
      const logGroups = await groupManager.groups()
      const ids = Object.values(logGroups).map(logGroup => (logGroup.group.logGroupName))
      expect(describeLogGroups.call).toHaveBeenCalledTimes(2)
      expect(ids).toEqual(['logGroup-1', 'logGroup-7', 'logGroup-8'])
    })
  })

  describe(`when error occurred when getting log groups`, () => {
    let errorLogger = console.error
    beforeEach(() => { console.error = jest.fn() })
    afterEach(() => { console.error = errorLogger })

    test(`retries with maximum retry count`, async () => {

      const AWS = require('aws-sdk')
      const describeLogGroups = jest.fn()
      describeLogGroups.call = jest.fn().mockImplementation((cloudwatch, params) => { throw new Error('mock error') })
      AWS.CloudWatchLogs = jest.fn().mockImplementation((config) => ({ describeLogGroups, config }))
      const groupManager = new GroupManager([
        { profile: 'profile-name-1', region: 'ap-southeast-1' }
      ])
      const logGroups = await groupManager.groups()
      expect(errorLogger).toHaveBeenCalled
      expect(describeLogGroups.call).toHaveBeenCalledTimes(5)
    })
  })

  describe(`when configurations of group manager is empty`, () => {
    test(`returns empty array`, async () => {
      const groupManager = new GroupManager([])
      const result = await groupManager.groups()
      expect(result).toEqual([])
    })
  })

  describe(`when given credentials not found`, () => {
    test(`throws InvalidCredentialsError`, async () => {
      jest.resetAllMocks()
      const AWS = require('aws-sdk')
      AWS.SharedIniFileCredentials = jest.fn().mockImplementation(() => { throw 'error' })
      const groupManager = new GroupManager([
        { profile: 'profile-name-1', region: 'ap-southeast-1' }
      ])
      await expect(groupManager.groups()).rejects.toThrow(InvalidCredentialsError)
    })
  })
})

describe(`tail`, () => {
  test(`calls tail on each log groups given`, async () => {
    const AWS = require('aws-sdk')
    const LogGroup = require(`${process.cwd()}/lib/LogGroup`)
    const tail = jest.fn()
    LogGroup.mockImplementation(() => ({ tail }))
    AWS.SharedIniFileCredentials = jest.fn().mockImplementation((options) => ({ profile: options.profile }))
    AWS.CloudWatchLogs = jest.fn().mockImplementation((config) => ({ config }))
    const logGroups = [
      { config: { region: 'ap-southeast-1', profile: 'profile-name-1' }, group: { logGroupName: '/aws/lambda/Function1' } },
      { config: { region: 'ap-southeast-1', profile: 'profile-name-1' }, group: { logGroupName: '/aws/ecs/api/logs' } }
    ]
    const groupManager = new GroupManager([])
    const result = await groupManager.tail(logGroups)
    expect(LogGroup).toHaveBeenCalledWith(expect.objectContaining({ group: expect.any(Object) }))
    expect(tail).toHaveBeenCalledTimes(logGroups.length)
  })
})