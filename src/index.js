const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const wasteTypeRoutes = require('./routes/wasteTypeRoutes');
const collectionPointRoutes = require('./routes/collectionPointRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');
const runMigrations = require('./migrations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// API Version 1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/waste-types', wasteTypeRoutes);
app.use('/api/v1/collection-points', collectionPointRoutes);
app.use('/api/v1/transactions', transactionRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Không tìm thấy ${req.originalUrl} trên server này!`));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Run migrations before starting the server
(async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Server đang chạy trên port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Xử lý lỗi không đồng bộ không được bắt
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
}); 