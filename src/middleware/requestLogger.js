const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

/**
 * Middleware để tạo request ID và log request
 */
const requestLoggerMiddleware = (req, res, next) => {
  // Tạo request ID
  req.id = uuidv4();
  
  // Lấy thông tin request
  const startTime = new Date();
  const reqInfo = {
    id: req.id,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || '-',
    userId: req.user ? req.user.userId : 'unauthenticated',
    startTime: startTime.toISOString()
  };
  
  // Log request bắt đầu
  logger.info(`Request started: ${req.method} ${req.originalUrl || req.url}`, { 
    requestInfo: reqInfo
  });
  
  // Xử lý khi response hoàn thành
  res.on('finish', () => {
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    // Log response
    logger[logLevel](`Request completed: ${req.method} ${req.originalUrl || req.url}`, {
      requestInfo: reqInfo,
      responseInfo: {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        endTime: endTime.toISOString()
      }
    });
  });
  
  next();
};

module.exports = requestLoggerMiddleware; 