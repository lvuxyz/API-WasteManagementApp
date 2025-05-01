const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { authenticateJWT, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes
router.get('/rankings', rewardController.getUserRankings);

// Protected routes - require user authentication
router.get('/my-rewards', authenticateJWT, rewardController.getMyRewards);
router.get('/my-total-points', authenticateJWT, rewardController.getMyTotalPoints);
router.get('/my-statistics', authenticateJWT, rewardController.getMyStatistics);
router.get('/:id', authenticateJWT, rewardController.getRewardById);

// Admin only routes
router.get('/users/:userId', authenticateJWT, authorizeRoles(['ADMIN']), rewardController.getUserRewards);
router.post('/', authenticateJWT, authorizeRoles(['ADMIN']), rewardController.createReward);
router.put('/:id', authenticateJWT, authorizeRoles(['ADMIN']), rewardController.updateReward);
router.delete('/:id', authenticateJWT, authorizeRoles(['ADMIN']), rewardController.deleteReward);
router.post('/transactions/:transactionId/process', authenticateJWT, authorizeRoles(['ADMIN']), rewardController.processTransactionReward);

module.exports = router; 