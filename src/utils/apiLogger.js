const logger = require('./logger');

/**
 * Ghi log khi bắt đầu hoặc kết thúc một hàm API
 * @param {string} controllerName Tên controller
 * @param {string} functionName Tên hàm
 * @param {string} message Thông điệp log
 * @param {object} req Express request object
 * @param {object} additionalData Dữ liệu bổ sung
 */
const logApiFunction = (controllerName, functionName, message, req, additionalData = {}) => {
  const requestInfo = req ? {
    id: req.id || '-',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || '-',
    userId: req.user ? req.user.userId : 'unauthenticated'
  } : {};

  logger.info(message, {
    controller: controllerName,
    functionName: functionName,
    requestInfo,
    ...additionalData
  });
};

/**
 * Ghi log lỗi trong API
 * @param {string} controllerName Tên controller
 * @param {string} functionName Tên hàm
 * @param {string} message Thông điệp log
 * @param {object} req Express request object
 * @param {Error} error Đối tượng lỗi
 * @param {object} additionalData Dữ liệu bổ sung
 */
const logApiError = (controllerName, functionName, message, req, error, additionalData = {}) => {
  const requestInfo = req ? {
    id: req.id || '-',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || '-',
    userId: req.user ? req.user.userId : 'unauthenticated'
  } : {};

  const errorDetails = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack
  } : error;

  logger.error(message, {
    controller: controllerName,
    functionName: functionName,
    requestInfo,
    error: errorDetails,
    ...additionalData
  });
};

/**
 * Ghi log cảnh báo trong API
 * @param {string} controllerName Tên controller
 * @param {string} functionName Tên hàm
 * @param {string} message Thông điệp log
 * @param {object} req Express request object
 * @param {object} additionalData Dữ liệu bổ sung
 */
const logApiWarning = (controllerName, functionName, message, req, additionalData = {}) => {
  const requestInfo = req ? {
    id: req.id || '-',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || '-',
    userId: req.user ? req.user.userId : 'unauthenticated'
  } : {};

  logger.warn(message, {
    controller: controllerName,
    functionName: functionName,
    requestInfo,
    ...additionalData
  });
};

/**
 * Tạo các hàm log liên kết với controller cụ thể
 * @param {string} controllerName Tên controller
 * @returns {object} Các hàm log
 */
const createControllerLogger = (controllerName) => {
  return {
    logFunction: (functionName, message, req, additionalData = {}) => {
      logApiFunction(controllerName, functionName, message, req, additionalData);
    },
    logError: (functionName, message, req, error, additionalData = {}) => {
      logApiError(controllerName, functionName, message, req, error, additionalData);
    },
    logWarning: (functionName, message, req, additionalData = {}) => {
      logApiWarning(controllerName, functionName, message, req, additionalData);
    }
  };
};

module.exports = {
  logApiFunction,
  logApiError,
  logApiWarning,
  createControllerLogger
}; 