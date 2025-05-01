const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Routes for authenticated users
router.get('/my-rewards', authenticateUser, rewardController.getMyRewards);
router.get('/my-total-points', authenticateUser, rewardController.getMyTotalPoints);
router.get('/my-statistics', authenticateUser, rewardController.getMyStatistics);

// Public routes
router.get('/rankings', rewardController.getUserRankings);

// Admin routes
router.get('/users/:userId', authenticateUser, authorizeRoles(['ADMIN']), rewardController.getUserRewards);
router.post('/', authenticateUser, authorizeRoles(['ADMIN']), rewardController.createReward);
router.post('/transactions/:transactionId/process', authenticateUser, authorizeRoles(['ADMIN']), rewardController.processTransactionReward);
router.put('/:id', authenticateUser, authorizeRoles(['ADMIN']), rewardController.updateReward);
router.delete('/:id', authenticateUser, authorizeRoles(['ADMIN']), rewardController.deleteReward);

// This route must be last to avoid conflicts with other routes
router.get('/:id', authenticateUser, rewardController.getRewardById);

module.exports = router; 