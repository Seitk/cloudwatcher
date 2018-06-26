jest.mock('aws-sdk')
jest.mock('util')
jest.mock(`${process.cwd()}/lib/Message`)
jest.mock(`${process.cwd()}/lib/modules/continueWithInternal`)

const LogGroup = require(`${process.cwd()}/lib/LogGroup`)

describe(`constructor`, () => {
  const logGroup = new LogGroup({
    cloudWatch: {
      filterLogEvents: jest.fn()
    },
    group: {}
  })

  test(`unpack payload and initialize methods`, async () => {
    expect(logGroup).toHaveProperty('cloudWatch')
    expect(logGroup).toHaveProperty('group')
    expect(logGroup).toHaveProperty('filterLogEvents')
  })
})

describe(`tail`, () => {
  const util = require('util')
  util.promisify.mockImplementation((func) => (func))

  beforeEach(() => { require('jest-mock-now')() })
  afterEach(() => { Date.now.mockRestore() })

  test(`creates and print readable messages from log events`, async () => {
    const Message = require(`${process.cwd()}/lib/Message`).mockImplementation((event) => (event))
    const continueWithInternal = require(`${process.cwd()}/lib/modules/continueWithInternal`).mockImplementation(jest.fn()).mockReset()

    const printReadableMessage = jest.fn()
    const latestReadableTime = 1529794463056
    const events = [
      { message: 'Testing message 1', timestamp: latestReadableTime, isReadable: true, print: printReadableMessage },
      { message: 'Testing message 1', timestamp: 1519794454739 }
    ]
    const filterLogEvents = jest.fn()
    filterLogEvents.call = jest.fn().mockImplementation(() => {
      return Promise.resolve({ events })
    })
    const logGroup = new LogGroup({ cloudWatch: { filterLogEvents }, group: {} })
    await logGroup.tail()

    expect(filterLogEvents.call).toHaveBeenCalledWith(
      expect.objectContaining({ filterLogEvents: expect.anything() }),
      expect.objectContaining({ startTime: Date.now() })
    )
    expect(Message).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String), timestamp: expect.any(Number) }))
    expect(printReadableMessage).toHaveBeenCalledTimes(1)

    expect(continueWithInternal).toHaveBeenCalledWith(
      logGroup,
      expect.objectContaining({
        pollingInterval: expect.any(Number)
      }),
      latestReadableTime + 1
    )
  })

  describe(`when calling tail with startTime`, () => {
    test(`tails logs from given startTime`, async () => {
      const continueWithInternal = require(`${process.cwd()}/lib/modules/continueWithInternal`).mockImplementation(jest.fn()).mockReset()
      const filterLogEvents = jest.fn()
      filterLogEvents.call = jest.fn().mockImplementation(() => { return Promise.resolve({ events: [] }) })
      const logGroup = new LogGroup({ cloudWatch: { filterLogEvents }, group: {} })

      await logGroup.tail({ startTime: Date.now() })
      expect(filterLogEvents.call).toHaveBeenCalledWith(
        expect.objectContaining({ filterLogEvents: expect.anything() }),
        expect.objectContaining({ startTime: Date.now() })
      )
    })
  })

  describe(`when no readable message available`, () => {
    test(`continue tailing with current timestamp`, async () => {
      const continueWithInternal = require(`${process.cwd()}/lib/modules/continueWithInternal`).mockImplementation(jest.fn()).mockReset()
      const filterLogEvents = jest.fn()
      filterLogEvents.call = jest.fn().mockImplementation(() => {
        return Promise.resolve({ events: [] })
      })
      const logGroup = new LogGroup({ cloudWatch: { filterLogEvents }, group: {} })
      await logGroup.tail()

      expect(continueWithInternal).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        Date.now()
      )
    })
  })

  describe(`when calling tail without a valid pollingInterval`, () => {
    test(`does not continue tailing`, async () => {
      const continueWithInternal = require(`${process.cwd()}/lib/modules/continueWithInternal`).mockImplementation(jest.fn()).mockReset()
      const filterLogEvents = jest.fn()
      filterLogEvents.call = jest.fn().mockImplementation(() => { return Promise.resolve({ events: [] }) })
      const logGroup = new LogGroup({ cloudWatch: { filterLogEvents }, group: {} })
      await logGroup.tail({ pollingInterval: null })

      expect(continueWithInternal).not.toHaveBeenCalled
    })
  })

  describe(`when error occurrs`, () => {
    let errorLogger = console.error
    beforeEach(() => { console.error = jest.fn().mockReset() })
    afterEach(() => { console.error = errorLogger })

    test(`does not crash but stop continue tailing`, async () => {
      const continueWithInternal = require(`${process.cwd()}/lib/modules/continueWithInternal`).mockImplementation(jest.fn()).mockReset()

      const filterLogEvents = jest.fn()
      filterLogEvents.call = jest.fn().mockImplementation(() => {
        return Promise.reject('error')
      })
      const logGroup = new LogGroup({ cloudWatch: { filterLogEvents }, group: {} })
      expect(await logGroup.tail()).not.toThrow

      expect(filterLogEvents.call).toHaveBeenCalled()
      expect(continueWithInternal).not.toHaveBeenCalled()
      expect(errorLogger).toHaveBeenCalled
    })
  })
})