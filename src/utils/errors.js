class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class DuplicateError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'DuplicateError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  BadRequestError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DuplicateError
}; 