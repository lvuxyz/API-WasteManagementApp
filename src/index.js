const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const wasteTypeRoutes = require('./routes/wasteTypeRoutes');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/errors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Version 1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/waste-types', wasteTypeRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Không tìm thấy ${req.originalUrl} trên server này!`));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});

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