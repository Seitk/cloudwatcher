const Retryable = require(`${process.cwd()}/lib/helpers/Retryable`)

describe(`with`, () => {
  test(`creates a Retryable context with options`, async () => {
    const result = Retryable.with({ maxRetryCount: 10 });
    expect(result.constructor.name).toEqual('RetryableContext');
    expect(result.options.maxRetryCount).toEqual(10);
  });
});

describe(`while`, () => {
  test(`creates a Retryable context with while condition`, async () => {
    const conditionFn = jest.fn().mockImplementation(() => false)
    const result = Retryable.while(conditionFn);
    expect(result.constructor.name).toEqual('RetryableContext');
    result.exec();
    expect(conditionFn).toHaveBeenCalled();
  });
});

describe(`exec`, () => {
  test(`execute given yield function`, async () => {
    const yieldFn = jest.fn();
    Retryable.exec(yieldFn);
    expect(yieldFn).toHaveBeenCalled();
  });

  describe(`when while condition is given`, () => {
    test(`re-executes the yield function until the condition is truthy`, async () => {
      let count = 0
      const yieldFn = jest.fn().mockImplementation(() => { count += 1 })
      const conditionFn = jest.fn().mockImplementation(() => (count < 3))
      await Retryable.while(conditionFn).exec(yieldFn);
      expect(conditionFn).toHaveBeenCalledTimes(4);
      expect(yieldFn).toHaveBeenCalledTimes(3);
    })
  })

  describe(`when error occurred`, () => {
    test(`retry until maximum retry count is reached`, async () => {
      let count = 0
      const yieldFn = jest.fn().mockImplementation(() => { throw 'some error' })
      await Retryable.with({ maxRetryCount: 3 }).exec(yieldFn);
      expect(yieldFn).toHaveBeenCalledTimes(3);
    })
  })
});
