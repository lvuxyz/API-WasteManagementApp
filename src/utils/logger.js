const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Tạo thư mục logs nếu chưa tồn tại
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Hàm trích xuất thông tin quan trọng từ metadata
const extractImportantInfo = (meta) => {
  const importantKeys = ['controller', 'functionName', 'requestId', 'userId', 'wasteTypeId', 'collectionPointId'];
  const importantInfo = {};

  importantKeys.forEach(key => {
    if (meta[key]) {
      importantInfo[key] = meta[key];
    } else if (meta.requestInfo && meta.requestInfo[key]) {
      importantInfo[key] = meta.requestInfo[key];
    }
  });

  return importantInfo;
};

// Hàm tạo chuỗi thông tin từ object
const formatImportantInfo = (info) => {
  if (Object.keys(info).length === 0) return '';
  
  return Object.entries(info)
    .map(([key, value]) => `${key}=${value}`)
    .join(' | ');
};

// Format log cho file 
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack, controller, functionName, ...meta }) => {
    // Trích xuất thông tin quan trọng
    const importantInfo = extractImportantInfo({ controller, functionName, ...meta });
    const infoString = formatImportantInfo(importantInfo);
    
    // Tạo dòng log cơ bản
    let log = `${timestamp} [${level.toUpperCase()}]`;
    
    // Thêm thông tin controller/function nếu có
    if (controller) log += ` [${controller}]`;
    if (functionName) log += `.${functionName}`;
    
    // Thêm message và thông tin quan trọng
    log += `: ${message}`;
    if (infoString) log += ` [${infoString}]`;
    
    // Thêm stack trace nếu có lỗi
    if (stack) log += `\n${stack}`;
    
    // Chỉ thêm metadata đầy đủ nếu có thông tin khác
    const allKeys = Object.keys(meta);
    const metadataKeys = allKeys.filter(key => !['controller', 'functionName', ...Object.keys(importantInfo)].includes(key));
    
    if (metadataKeys.length > 0) {
      const filteredMeta = {};
      metadataKeys.forEach(key => {
        filteredMeta[key] = meta[key];
      });
      
      // Thêm metadata đã lọc ở dạng JSON gọn gàng
      if (Object.keys(filteredMeta).length > 0) {
        log += `\n${JSON.stringify(filteredMeta, null, 2)}`;
      }
    }
    
    return log;
  })
);

// Định dạng cho console với màu sắc
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack, controller, functionName, ...meta }) => {
    // Trích xuất thông tin quan trọng
    const importantInfo = extractImportantInfo({ controller, functionName, ...meta });
    const infoString = formatImportantInfo(importantInfo);
    
    // Tạo dòng log cơ bản với màu
    let log = `${timestamp} ${level}`;
    
    // Thêm thông tin controller/function
    if (controller) log += ` [${controller}`;
    if (functionName) log += `.${functionName}`;
    if (controller) log += `]`;
    
    // Thêm message và thông tin quan trọng
    log += `: ${message}`;
    if (infoString) log += ` [${infoString}]`;
    
    // Thêm stack trace nếu có lỗi
    if (stack) log += `\n${stack}`;
    
    // Không hiển thị metadata đầy đủ trong console trừ khi là lỗi
    if (level.includes('error') || level.includes('warn')) {
      const { requestInfo, error, ...otherMeta } = meta;
      
      if (error) {
        log += `\nError: ${JSON.stringify(error, null, 2)}`;
      }
      
      if (Object.keys(otherMeta).length > 0) {
        log += `\nDetails: ${JSON.stringify(otherMeta, null, 2)}`;
      }
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