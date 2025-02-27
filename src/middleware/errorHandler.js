const { AppError } = require('../utils/errors');

const handleJWTError = () => {
  return new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Token đã hết hạn! Vui lòng đăng nhập lại.', 401);
};

const handleDuplicateFieldsDB = (error) => {
  if (error.keyValue) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return new AppError(`${field} '${value}' đã tồn tại trong hệ thống.`, 409);
  }
  return new AppError('Dữ liệu bị trùng lặp trong hệ thống.', 409);
};

const handleValidationErrorDB = (error) => {
  // Kiểm tra xem error.errors có tồn tại không
  if (error.errors) {
    const errors = Object.values(error.errors).map(err => err.message);
    return new AppError(`Dữ liệu không hợp lệ: ${errors.join('. ')}`, 400);
  }
  return new AppError('Dữ liệu không hợp lệ', 400);
};

const handleMySQLError = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    return new AppError('Dữ liệu đã tồn tại trong hệ thống.', 409);
  }
  return new AppError('Lỗi database', 500);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Lỗi đã được xử lý
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Lỗi không xác định
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra! Vui lòng thử lại sau.'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.code === 11000 || error.code === 'ER_DUP_ENTRY') error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.code && error.errno) error = handleMySQLError(error);

    sendErrorProd(error, res);
  }
}; 