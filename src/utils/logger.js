const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Tạo thư mục logs nếu chưa tồn tại
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Format log chuẩn
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack, controller, functionName, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    
    // Thêm thông tin về controller và function nếu có
    if (controller) log += ` [${controller}]`;
    if (functionName) log += ` [${functionName}]`;
    
    log += `: ${message}`;
    
    // Thêm stack trace nếu có
    if (stack) log += `\n${stack}`;
    
    // Thêm thông tin bổ sung
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Định dạng cho console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack, controller, functionName, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    
    // Thêm thông tin về controller và function nếu có
    if (controller) log += ` [${controller}]`;
    if (functionName) log += ` [${functionName}]`;
    
    log += `: ${message}`;
    
    // Thêm stack trace nếu có
    if (stack) log += `\n${stack}`;
    
    // Thêm thông tin bổ sung
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'waste-management-api' },
  transports: [
    // Log lỗi
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Log tất cả
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Log API riêng biệt
    new winston.transports.File({
      filename: path.join(logDir, 'api.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Thêm console transport trong môi trường không phải production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

module.exports = logger; 