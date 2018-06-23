const Errors = require(`${process.cwd()}/lib/Errors`)

describe(`Errors`, () => {
  test(`returns an object of errors`, async () => {
    Object.values(Errors).forEach((klass) => {
      const error = new klass()
      expect(error).toBeInstanceOf(Error)
      expect(error.stack).toBeTruthy()
    })
  })

  describe(`when error stacktrace is not available`, () => {
    test(`creates new error and use new stacktrace`, async () => {
      const captureStackTrace = global.Error.captureStackTrace
      global.Error.captureStackTrace = null

      Object.values(Errors).forEach((klass) => {
        const error = new klass()
        expect(error).toBeInstanceOf(Error)
        expect(error.stack).toBeTruthy()
      })

      global.Error.captureStackTrace = captureStackTrace
    })
  })
})