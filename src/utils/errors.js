class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message || 'Dữ liệu không hợp lệ', 400);
    this.name = 'ValidationError';
    if (details) this.details = details;
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message || 'Yêu cầu không hợp lệ', 400);
    this.name = 'BadRequestError';
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message || 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập', 401);
    this.name = 'AuthenticationError';
  }
}

class InvalidCredentialsError extends AuthenticationError {
  constructor(message) {
    super(message || 'Thông tin đăng nhập không chính xác');
    this.name = 'InvalidCredentialsError';
  }
}

class UserNotFoundError extends AuthenticationError {
  constructor(username) {
    super(`Tài khoản '${username}' không tồn tại trong hệ thống`);
    this.name = 'UserNotFoundError';
  }
}

class InvalidPasswordError extends AuthenticationError {
  constructor() {
    super('Mật khẩu không chính xác');
    this.name = 'InvalidPasswordError';
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message || 'Bạn không có quyền thực hiện thao tác này', 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message, resource) {
    const defaultMessage = resource 
      ? `Không tìm thấy ${resource}`
      : 'Không tìm thấy tài nguyên yêu cầu';
    super(message || defaultMessage, 404);
    this.name = 'NotFoundError';
    if (resource) this.resource = resource;
  }
}

class DuplicateError extends AppError {
  constructor(message, field, value) {
    let defaultMessage = 'Dữ liệu đã tồn tại trong hệ thống';
    if (field && value) {
      defaultMessage = `${field} '${value}' đã tồn tại trong hệ thống`;
    }
    super(message || defaultMessage, 409);
    this.name = 'DuplicateError';
    if (field) this.field = field;
    if (value) this.value = value;
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message || 'Lỗi khi truy cập cơ sở dữ liệu', 500);
    this.name = 'DatabaseError';
    if (originalError) this.originalError = originalError;
  }
}

class RateLimitError extends AppError {
  constructor(message) {
    super(message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau', 429);
    this.name = 'RateLimitError';
  }
}

class FileUploadError extends AppError {
  constructor(message, details = null) {
    super(message || 'Lỗi khi tải tệp lên', 400);
    this.name = 'FileUploadError';
    if (details) this.details = details;
  }
}

class PaymentError extends AppError {
  constructor(message, details = null) {
    super(message || 'Lỗi trong quá trình thanh toán', 400);
    this.name = 'PaymentError';
    if (details) this.details = details;
  }
}

class NetworkError extends AppError {
  constructor(message, service = null) {
    const defaultMessage = service 
      ? `Lỗi kết nối với dịch vụ ${service}`
      : 'Lỗi kết nối mạng';
    super(message || defaultMessage, 503);
    this.name = 'NetworkError';
    if (service) this.service = service;
  }
}

module.exports = {
  AppError,
  ValidationError,
  BadRequestError,
  AuthenticationError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidPasswordError,
  AuthorizationError,
  NotFoundError,
  DuplicateError,
  DatabaseError,
  RateLimitError,
  FileUploadError,
  PaymentError,
  NetworkError
}; 