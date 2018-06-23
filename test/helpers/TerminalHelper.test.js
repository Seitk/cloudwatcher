const TerminalHelper = require(`${process.cwd()}/lib/helpers/TerminalHelper`)

describe(`reset`, () => {
  test(`write clear screen command to stdout`, async () => {
    const stdout = process.stdout.write
    const stdoutMock = jest.fn()
    process.stdout.write = stdoutMock
    TerminalHelper.reset()
    expect(stdoutMock).toHaveBeenCalled
    process.stdout.write = stdout
  })
})