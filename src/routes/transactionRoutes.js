const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Tạo giao dịch mới
router.post('/', authenticateUser, transactionController.createTransaction);

// Lấy danh sách giao dịch (phân trang)
router.get('/', authenticateUser, transactionController.getTransactions);

// Lấy lịch sử giao dịch của người dùng
router.get('/user/:userId', authenticateUser, transactionController.getUserTransactions);

// Lấy thống kê giao dịch (chỉ admin)
router.get('/statistics', authenticateUser, authorizeRoles('ADMIN'), transactionController.getTransactionStatistics);

// Lấy chi tiết giao dịch theo ID
router.get('/:id', authenticateUser, transactionController.getTransactionById);

// Cập nhật trạng thái giao dịch (chỉ admin)
router.patch('/:id/status', authenticateUser, authorizeRoles('ADMIN'), transactionController.updateTransactionStatus);

// Lấy lịch sử giao dịch
router.get('/:id/history', authenticateUser, transactionController.getTransactionHistory);

module.exports = router; 