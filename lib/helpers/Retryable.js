class RetryableContext {
  constructor(loopOptions) {
    this.options = {
      maxRetryCount: 5,
      ...loopOptions,
    };
    this.store = {
      retryCount: 0,
    };
  }

  setYield(fn) {
    this.yieldFn = fn;
    return this;
  }

  setCondition(fn) {
    this.conditionFn = fn;
    return this;
  }

  while(fn) {
    return this.setCondition(fn);
  }

  async exec(yieldFn) {
    if (yieldFn !== undefined) { this.yieldFn = yieldFn; }
    if ((typeof this.conditionFn === 'function' && !this.conditionFn()) || !this.yieldFn) {
      return;
    }

    try {
      await this.yieldFn();
      if (this.conditionFn) {
        this.exec();
      }
    } catch (e) {
      this.store.retryCount += 1;
      if (this.store.retryCount < this.options.maxRetryCount) {
        await this.exec();
      }
    }
  }
}

class Retryable {
  static with(options) {
    return new RetryableContext(options);
  }

  static while(conditionFn) {
    return new RetryableContext().while(conditionFn);
  }

  static async exec(yieldFn) {
    await new RetryableContext().setYield(yieldFn).exec();
  }
}

module.exports = Retryable;
