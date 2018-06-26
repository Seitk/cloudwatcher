const continueWithInternal = require(`${process.cwd()}/lib/modules/continueWithInternal`)

describe(`continueWithInternal`, () => {
  jest.useFakeTimers()

  beforeEach(() => { require('jest-mock-now')() })
  afterEach(() => { Date.now.mockRestore() })

  test(`runs tail after a duration`, async () => {
    const options = {
      pollingInterval: 5000
    }
    const startTime = Date.now()
    const tail = jest.fn()
    const logGroup = { tail }
    continueWithInternal(logGroup, options, startTime)
    jest.runAllTimers()

    expect(tail).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: Date.now()
      })
    )
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), options.pollingInterval)
  })

  describe(`when startTime is not given`, () => {
    test(`continues with current time`, async () => {
      const tail = jest.fn()
      const logGroup = { tail }
      continueWithInternal(logGroup)
      jest.runAllTimers()

      expect(tail).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: Date.now()
        })
      )
    })
  })
})