const rewardRepository = require('../repositories/rewardRepository');
const RewardValidator = require('../validators/rewardValidator');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');

const rewardController = {
  /**
   * Get current user's rewards
   */
  getMyRewards: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Extract filters from query params
      const filters = {
        from_date: req.query.from_date,
        to_date: req.query.to_date
      };
      
      const result = await rewardRepository.getUserRewards(userId, page, limit, filters);
      
      res.json({
        success: true,
        message: 'Lấy thông tin điểm thưởng thành công',
        data: {
          rewards: result.rewards,
          total_points: result.total_points,
          pagination: result.pagination
        }
      });
    } catch (error) {
      logger.error('Error in getMyRewards:', error);
      next(error);
    }
  },
  
  /**
   * Get current user's total points
   */
  getMyTotalPoints: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      
      const result = await rewardRepository.getUserTotalPoints(userId);
      
      res.json({
        success: true,
        message: 'Lấy tổng điểm thưởng thành công',
        data: {
          total_points: result.total_points
        }
      });
    } catch (error) {
      logger.error('Error in getMyTotalPoints:', error);
      next(error);
    }
  },
  
  /**
   * Get current user's reward statistics
   */
  getMyStatistics: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const period = req.query.period || 'monthly';
      
      // Validate period
      const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
      if (!validPeriods.includes(period)) {
        throw new ValidationError('Khoảng thời gian không hợp lệ. Chọn một trong: daily, weekly, monthly, yearly');
      }
      
      const result = await rewardRepository.getUserRewardsStatistics(userId, period);
      
      res.json({
        success: true,
        message: 'Lấy thống kê điểm thưởng thành công',
        data: result
      });
    } catch (error) {
      logger.error('Error in getMyStatistics:', error);
      next(error);
    }
  },
  
  /**
   * Get user rankings
   */
  getUserRankings: async (req, res, next) => {
    try {
      const rankings = await rewardRepository.getUserRankings();
      
      res.json({
        success: true,
        message: rankings.length > 0 
          ? 'Lấy bảng xếp hạng thành công' 
          : 'Chưa có dữ liệu xếp hạng',
        data: rankings
      });
    } catch (error) {
      logger.error('Error in getUserRankings:', error);
      next(error);
    }
  },
  
  /**
   * Get reward by ID
   */
  getRewardById: async (req, res, next) => {
    try {
      const rewardId = parseInt(req.params.id);
      const userId = req.user.userId;
      const isAdmin = req.user.roles.includes('ADMIN');
      
      const reward = await rewardRepository.getRewardById(rewardId);
      
      // Check if reward belongs to user or user is admin
      if (reward.user_id !== userId && !isAdmin) {
        throw new AuthorizationError('Bạn không có quyền xem thông tin điểm thưởng này');
      }
      
      res.json({
        success: true,
        message: 'Lấy thông tin điểm thưởng thành công',
        data: reward
      });
    } catch (error) {
      logger.error(`Error in getRewardById (${req.params.id}):`, error);
      next(error);
    }
  },
  
  /**
   * Get rewards for a specific user (admin only)
   */
  getUserRewards: async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Extract filters from query params
      const filters = {
        from_date: req.query.from_date,
        to_date: req.query.to_date
      };
      
      const result = await rewardRepository.getUserRewards(userId, page, limit, filters);
      
      res.json({
        success: true,
        message: 'Lấy thông tin điểm thưởng của người dùng thành công',
        data: result
      });
    } catch (error) {
      logger.error(`Error in getUserRewards (${req.params.userId}):`, error);
      next(error);
    }
  },
  
  /**
   * Create a new reward (admin only)
   */
  createReward: async (req, res, next) => {
    try {
      // Validate request data
      RewardValidator.validateCreateReward(req.body);
      
      const rewardData = {
        user_id: parseInt(req.body.user_id),
        points: parseInt(req.body.points),
        transaction_id: req.body.transaction_id ? parseInt(req.body.transaction_id) : null
      };
      
      const reward = await rewardRepository.createReward(rewardData);
      
      res.status(201).json({
        success: true,
        message: 'Thêm điểm thưởng thành công',
        data: reward
      });
    } catch (error) {
      logger.error('Error in createReward:', error);
      next(error);
    }
  },
  
  /**
   * Update a reward (admin only)
   */
  updateReward: async (req, res, next) => {
    try {
      const rewardId = parseInt(req.params.id);
      
      // Validate request data
      RewardValidator.validateUpdateReward(req.body);
      
      const updateData = {
        points: parseInt(req.body.points)
      };
      
      const reward = await rewardRepository.updateReward(rewardId, updateData);
      
      res.json({
        success: true,
        message: 'Cập nhật điểm thưởng thành công',
        data: reward
      });
    } catch (error) {
      logger.error(`Error in updateReward (${req.params.id}):`, error);
      next(error);
    }
  },
  
  /**
   * Delete a reward (admin only)
   */
  deleteReward: async (req, res, next) => {
    try {
      const rewardId = parseInt(req.params.id);
      
      await rewardRepository.deleteReward(rewardId);
      
      res.json({
        success: true,
        message: 'Xóa điểm thưởng thành công'
      });
    } catch (error) {
      logger.error(`Error in deleteReward (${req.params.id}):`, error);
      next(error);
    }
  },
  
  /**
   * Process transaction reward
   * This is typically called when a transaction status is updated to completed
   */
  processTransactionReward: async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      
      const reward = await rewardRepository.processTransactionReward(transactionId);
      
      res.json({
        success: true,
        message: 'Xử lý điểm thưởng cho giao dịch thành công',
        data: reward
      });
    } catch (error) {
      logger.error(`Error in processTransactionReward (${req.params.transactionId}):`, error);
      next(error);
    }
  }
};

module.exports = rewardController; 