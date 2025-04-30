const express = require('express');
const router = express.Router();
const recyclingController = require('../controllers/recyclingController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const { getRecyclingStatistics } = require('../controllers/recyclingController');

// 0. Lấy toàn bộ danh sách quy trình tái chế (đơn giản)
router.get('/all', recyclingController.getAllRecyclingProcesses);

// 5. Thống kê quá trình tái chế (đặt đầu tiên vì có pattern cụ thể)
router.get('/report', authenticateUser, authorizeRoles('ADMIN'), recyclingController.getRecyclingReport);

// 6. Lấy danh sách quá trình tái chế theo người dùng
router.get('/user/:userId', authenticateUser, recyclingController.getUserRecyclingProcesses);

// 7. Gửi thông báo cập nhật quá trình tái chế
router.post('/notify/:id', authenticateUser, authorizeRoles('ADMIN'), recyclingController.sendRecyclingNotification);

// Get recycling statistics (moved above the :id route to prevent param matching)
router.get('/statistics', authenticateUser, authorizeRoles('ADMIN'), getRecyclingStatistics);

// 3. Xem chi tiết quá trình tái chế (đặt sau các route cụ thể)
router.get('/:id', authenticateUser, recyclingController.getRecyclingProcessById);

// 4. Cập nhật trạng thái & thông tin quá trình tái chế
router.put('/:id', authenticateUser, authorizeRoles('ADMIN'), recyclingController.updateRecyclingProcess);

// 1. Lấy danh sách quá trình tái chế (đặt sau cùng vì là route gốc)
router.get('/', authenticateUser, recyclingController.getRecyclingProcesses);

// 2. Tạo mới quá trình tái chế
router.post('/', authenticateUser, authorizeRoles('ADMIN'), recyclingController.createRecyclingProcess);

module.exports = router; 