class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

class InvalidCredentialsError extends BaseError {}
class ConfigurationError extends BaseError {}
class NotFoundError extends BaseError {}
class ArgumentsError extends BaseError {}

module.exports = {
  InvalidCredentialsError,
  ConfigurationError,
  NotFoundError,
  ArgumentsError,
};
