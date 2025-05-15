const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Xử lý lỗi JWT không hợp lệ
 */
const handleJWTError = () => {
  return new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401);
};

/**
 * Xử lý lỗi JWT hết hạn
 */
const handleJWTExpiredError = () => {
  return new AppError('Token đã hết hạn! Vui lòng đăng nhập lại.', 401);
};

/**
 * Xử lý lỗi trùng lặp dữ liệu trong cơ sở dữ liệu
 */
const handleDuplicateFieldsDB = (error) => {
  // MongoDB duplicate error
  if (error.keyValue) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return new AppError(`${field} '${value}' đã tồn tại trong hệ thống.`, 409);
  }
  
  // MySQL duplicate error
  if (error.code === 'ER_DUP_ENTRY') {
    // Cố gắng trích xuất thông tin từ thông báo lỗi MySQL
    const match = error.sqlMessage?.match(/Duplicate entry '(.+)' for key '(.+)'/);
    if (match && match.length === 3) {
      const [, value, key] = match;
      return new AppError(`Giá trị '${value}' đã tồn tại cho trường ${key.replace(/^\w+\./, '')}.`, 409);
    }
  }
  
  return new AppError('Dữ liệu bị trùng lặp trong hệ thống.', 409);
};

/**
 * Xử lý lỗi validation từ Mongoose/Sequelize
 */
const handleValidationErrorDB = (error) => {
  // Mongoose validation error
  if (error.errors) {
    const errors = Object.values(error.errors).map(err => err.message);
    return new AppError(`Dữ liệu không hợp lệ: ${errors.join('. ')}`, 400);
  }
  
  // Sequelize validation error
  if (error.name === 'SequelizeValidationError' && error.errors) {
    const errors = error.errors.map(e => e.message);
    return new AppError(`Dữ liệu không hợp lệ: ${errors.join('. ')}`, 400);
  }
  
  return new AppError('Dữ liệu không hợp lệ', 400);
};

/**
 * Xử lý các lỗi MySQL phổ biến
 */
const handleMySQLError = (error, req) => {
  // Xử lý các lỗi MySQL phổ biến và đưa ra thông báo người dùng thân thiện
  const mysqlErrors = {
    'ER_DUP_ENTRY': { message: 'Dữ liệu đã tồn tại trong hệ thống.', statusCode: 409 },
    'ER_NO_REFERENCED_ROW': { message: 'Dữ liệu tham chiếu không tồn tại.', statusCode: 400 },
    'ER_ROW_IS_REFERENCED': { message: 'Không thể xóa dữ liệu này vì có dữ liệu khác đang tham chiếu đến nó.', statusCode: 400 },
    'ER_BAD_FIELD_ERROR': { message: 'Trường dữ liệu không tồn tại.', statusCode: 400 },
    'ER_ACCESS_DENIED_ERROR': { message: 'Lỗi xác thực cơ sở dữ liệu.', statusCode: 500 },
    'ER_LOCK_WAIT_TIMEOUT': { message: 'Hệ thống đang bận. Vui lòng thử lại sau.', statusCode: 500 },
    'ER_LOCK_DEADLOCK': { message: 'Xung đột dữ liệu. Vui lòng thử lại sau.', statusCode: 500 },
    'ER_CANNOT_ADD_FOREIGN': { message: 'Dữ liệu tham chiếu không hợp lệ.', statusCode: 400 },
  };

  if (error.code && mysqlErrors[error.code]) {
    const { message, statusCode } = mysqlErrors[error.code];
    return new AppError(message, statusCode);
  }

  // Log chi tiết lỗi database
  const logData = {
    errorCode: error.code,
    sqlMessage: error.sqlMessage,
    sqlQuery: error.sql ? error.sql.substring(0, 200) : undefined, // Chỉ log 200 ký tự đầu tiên của query
    errno: error.errno,
    requestId: req?.id
  };

  logger.error(`Lỗi MySQL không xử lý được: ${error.code || 'unknown'}`, logData);
  
  return new AppError('Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.', 500);
};

/**
 * Gửi lỗi trong môi trường phát triển
 */
const sendErrorDev = (err, req, res) => {
  const errorMeta = {
    path: req.originalUrl,
    method: req.method,
    requestId: req.id,
    userId: req.user?.userId,
    body: Object.keys(req.body || {}).length > 0 ? req.body : undefined
  };

  // Log chi tiết hơn về lỗi
  logger.error(`API Error [${err.statusCode}] ${err.message}`, {
    ...errorMeta,
    errorName: err.name,
    errorStack: err.stack
  });

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

/**
 * Gửi lỗi trong môi trường sản phẩm
 */
const sendErrorProd = (err, req, res) => {
  // Thông tin cơ bản về request
  const errorMeta = {
    path: req.originalUrl,
    method: req.method,
    requestId: req.id,
    userId: req.user?.userId
  };

  // Log lỗi chi tiết với metadata hữu ích
  logger.error(`API Error [${err.statusCode}] ${err.message}`, {
    ...errorMeta,
    errorName: err.name,
    errorCode: err.code,
    errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Lỗi đã được xử lý
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  
  // Lỗi không xác định - không gửi chi tiết cho người dùng
  logger.error(`Lỗi hệ thống không xác định: ${err.message}`, { 
    ...errorMeta,
    error: {
      name: err.name,
      code: err.code
    }
  });
  
  return res.status(500).json({
    status: 'error',
    message: 'Có lỗi xảy ra! Vui lòng thử lại sau.'
  });
};

/**
 * Middleware xử lý tất cả các lỗi toàn cục
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Phân biệt môi trường phát triển và sản phẩm
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.stack = err.stack;

    // Xử lý các loại lỗi phổ biến
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.code === 11000 || error.code === 'ER_DUP_ENTRY') error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError') error = handleValidationErrorDB(error);
    if (error.code && error.errno) error = handleMySQLError(error, req);

    sendErrorProd(error, req, res);
  }
}; 