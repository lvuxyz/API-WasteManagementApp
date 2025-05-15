const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const wasteTypeRoutes = require('./routes/wasteTypeRoutes');
const collectionPointRoutes = require('./routes/collectionPointRoutes');
const recyclingRoutes = require('./routes/recyclingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger middleware
app.use((req, res, next) => {
  // Tạo request ID ngẫu nhiên
  req.id = require('crypto').randomUUID();
  
  // Lấy thông tin cơ bản của request
  const startTime = Date.now();
  const reqInfo = {
    method: req.method,
    url: req.originalUrl || req.url,
    requestId: req.id,
    userId: req.user ? req.user.userId : undefined,
    ip: req.ip || req.headers['x-forwarded-for']
  };
  
  // Log bắt đầu request
  logger.info(`Request started ${req.method} ${req.originalUrl}`, reqInfo);
  
  // Lưu thời gian bắt đầu để tính thời gian xử lý
  req.startTime = startTime;
  
  // Bắt event khi response hoàn thành
  res.on('finish', () => {
    // Tính thời gian xử lý
    const duration = Date.now() - startTime;
    
    // Chọn log level dựa trên status code
    const logLevel = res.statusCode >= 500 
      ? 'error' 
      : res.statusCode >= 400 
        ? 'warn' 
        : 'info';
    
    // Tạo thông tin phản hồi
    const responseInfo = {
      ...reqInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // Log kết thúc request với thông tin phản hồi
    logger[logLevel](
      `Request completed ${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`, 
      responseInfo
    );
  });
  
  next();
});

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// API Version 1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/waste-types', wasteTypeRoutes);
app.use('/api/v1/collection-points', collectionPointRoutes);
app.use('/api/v1/recycling', recyclingRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/rewards', rewardRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Không tìm thấy ${req.originalUrl} trên server này!`));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Khởi động server trực tiếp không chạy migrations
(async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Server đang chạy trên port ${PORT} trong môi trường ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Không thể khởi động server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
})();

// Xử lý lỗi unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('LỖI KHÔNG XỬ LÝ - UNHANDLED REJECTION:', { 
    error: err.message,
    stack: err.stack 
  });
  
  // Đóng server một cách an toàn và thoát
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Xử lý lỗi uncaught exceptions 
process.on('uncaughtException', (err) => {
  logger.error('LỖI KHÔNG BẮT ĐƯỢC - UNCAUGHT EXCEPTION:', { 
    error: err.message,
    stack: err.stack 
  });
  
  // Lỗi uncaught là lỗi nghiêm trọng, nên thoát ngay
  process.exit(1);
});

// Xử lý SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  process.exit(0);
});

// Xử lý SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('SIGINT RECEIVED. Shutting down gracefully');
  process.exit(0);
}); 