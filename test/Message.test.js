const Message = require(`${process.cwd()}/lib/Message`)

describe(`constructor`, () => {
  const message = new Message({ message: '2018-06-24 00:08:57\tREQUEST_ID\tTesting message 1', timestamp: 1529794454739 })

  test(`unpack payload and initialize methods`, async () => {
    expect(message).toHaveProperty('_event')
  })
})

describe(`print`, () => {
  let consoleLogger = console.log
  beforeEach(() => { console.log = jest.fn().mockReset() })
  afterEach(() => { console.log = consoleLogger })

  test(`output formatted message`, async () => {
    const message = new Message({ message: '2018-06-24 00:08:57\tREQUEST_ID\tTesting message 1', timestamp: 1529794454739 })
    message.format = jest.fn().mockReturnValue('formatted message')
    message.isReadable = jest.fn().mockReturnValue(true)
    message.print()
    expect(message.format).toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith(expect.any(String))
  })

  describe(`when message is not readable`, () => {
    test(`returns empty string`, async () => {
      const message = new Message({ message: 'START RequestId', timestamp: 1529794454739 })
      message.format = jest.fn().mockReturnValue('formatted message')
      message.isReadable = jest.fn().mockReturnValue(false)
      expect(message.print()).toEqual('')
      expect(message.format).not.toHaveBeenCalled()
    })
  })
})

describe(`format`, () => {
  test(`returns formatted string`, () => {
    message = new Message({ message: '2018-06-23T22:54:14.739Z\tREQUEST_ID\tTesting message 1', timestamp: 1529794454739 })
    const formatted = message.format()
    expect(formatted.indexOf('Testing message 1')).toBeGreaterThan(-1)
    expect(formatted.indexOf(message.createdAt)).toBeGreaterThan(-1)
  })
})

describe(`isReadable`, () => {
  test(`returns false when event has no message or message is unreadable`, () => {
    let message;
    message = new Message({ message: 'START RequestId', timestamp: 1529794454739 })
    expect(message.isReadable).toEqual(false)

    message = new Message({ timestamp: 1529794454739 })
    expect(message.isReadable).toEqual(false)

    message = new Message({ message: '2018-06-24 00:08:57\tREQUEST_ID\tTesting message 1', timestamp: 1529794454739 })
    expect(message.isReadable).toEqual(true)
  })
})

describe(`createdAt`, () => {
  test(`returns formatted datetime format`, async () => {
    const date = new Date('2018-06-23T22:54:14.739Z')
    const message = new Message({ timestamp: date.getTime() })
    expect(message.createdAt).toEqual('2018-06-23 22:54:14')
  })
})