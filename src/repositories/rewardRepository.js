const pool = require('../config/database');
const { NotFoundError, DatabaseError } = require('../utils/errors');
const logger = require('../utils/logger');

class RewardRepository {
  /**
   * Get rewards for a specific user with pagination
   */
  static async getUserRewards(userId, page = 1, limit = 10) {
    try {
      // Validate and sanitize input
      const safeUserId = parseInt(userId);
      const safePage = Math.max(1, parseInt(page));
      const safeLimit = Math.max(1, Math.min(50, parseInt(limit)));
      const offset = (safePage - 1) * safeLimit;

      // Get user rewards with basic information
      const query = `
        SELECT 
          r.reward_id,
          r.points,
          r.earned_date,
          IFNULL(t.transaction_date, r.earned_date) as transaction_date,
          IFNULL(wt.name, 'Manual Reward') as source
        FROM rewards r
        LEFT JOIN transactions t ON r.transaction_id = t.transaction_id
        LEFT JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
        WHERE r.user_id = ?
        ORDER BY r.earned_date DESC
        LIMIT ? OFFSET ?
      `;

      const [rewards] = await pool.query(query, [safeUserId, safeLimit, offset]);

      // Get total points
      const [totalPoints] = await pool.query(
        'SELECT IFNULL(SUM(points), 0) as total FROM rewards WHERE user_id = ?',
        [safeUserId]
      );

      // Get total count of rewards
      const [totalCount] = await pool.query(
        'SELECT COUNT(*) as count FROM rewards WHERE user_id = ?',
        [safeUserId]
      );

      const total = parseInt(totalCount[0].count);
      const totalPages = Math.ceil(total / safeLimit);

      return {
        rewards: rewards.map(reward => ({
          ...reward,
          points: parseInt(reward.points)
        })),
        total_points: parseInt(totalPoints[0].total),
        pagination: {
          current_page: safePage,
          total_pages: totalPages,
          total_items: total,
          items_per_page: safeLimit
        }
      };
    } catch (error) {
      logger.error('Error in getUserRewards:', error);
      throw new DatabaseError('Không thể lấy thông tin điểm thưởng của người dùng');
    }
  }

  /**
   * Get total points for a user
   */
  static async getUserTotalPoints(userId) {
    try {
      const [result] = await pool.execute(
        'SELECT SUM(points) as total_points FROM rewards WHERE user_id = ?',
        [userId]
      );
      
      return {
        total_points: result[0].total_points || 0
      };
    } catch (error) {
      logger.error('Error getting user total points:', error);
      throw new DatabaseError('Error retrieving user total points');
    }
  }

  /**
   * Get user rewards statistics by period
   */
  static async getUserRewardsStatistics(userId, period = 'monthly') {
    try {
      let groupFormat;
      
      // Define date format for different periods
      switch (period) {
        case 'daily':
          groupFormat = '%Y-%m-%d';
          break;
        case 'weekly':
          groupFormat = '%x-W%v'; // Year-Week format
          break;
        case 'monthly':
          groupFormat = '%Y-%m';
          break;
        case 'yearly':
          groupFormat = '%Y';
          break;
        default:
          groupFormat = '%Y-%m';
      }
      
      const query = `
        SELECT 
          DATE_FORMAT(earned_date, ?) as period,
          SUM(points) as total_points,
          COUNT(*) as reward_count
        FROM rewards
        WHERE user_id = ?
        GROUP BY period
        ORDER BY MIN(earned_date) DESC
        LIMIT 12
      `;
      
      const [statistics] = await pool.execute(query, [groupFormat, userId]);
      
      return {
        period,
        statistics
      };
    } catch (error) {
      logger.error('Error getting user rewards statistics:', error);
      throw new DatabaseError('Error retrieving user rewards statistics');
    }
  }

  /**
   * Get user rankings by total points
   */
  static async getUserRankings() {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.username,
          u.full_name,
          IFNULL(SUM(r.points), 0) as total_points
        FROM users u
        LEFT JOIN rewards r ON u.user_id = r.user_id
        GROUP BY u.user_id, u.username, u.full_name
        ORDER BY total_points DESC
        LIMIT 10
      `;
      
      const [rankings] = await pool.query(query);
      
      // Add rank number and format response
      return rankings.map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        total_points: parseInt(user.total_points)
      }));
    } catch (error) {
      logger.error('Error in getUserRankings:', error);
      throw new DatabaseError('Không thể lấy thông tin bảng xếp hạng');
    }
  }

  /**
   * Get reward by ID
   */
  static async getRewardById(rewardId) {
    try {
      const [rewards] = await pool.execute(
        `SELECT r.*, t.transaction_date, t.quantity, t.unit, 
                wt.name as waste_type_name, wt.unit_price
         FROM rewards r
         LEFT JOIN transactions t ON r.transaction_id = t.transaction_id
         LEFT JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
         WHERE r.reward_id = ?`,
        [rewardId]
      );
      
      if (rewards.length === 0) {
        throw new NotFoundError('Không tìm thấy thông tin điểm thưởng');
      }
      
      return rewards[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error getting reward by ID (${rewardId}):`, error);
      throw new DatabaseError('Error retrieving reward details');
    }
  }

  /**
   * Create reward
   * Used when a transaction is marked as completed or when admin manually adds rewards
   */
  static async createReward(rewardData) {
    try {
      // Build query based on available data
      let fields = ['user_id', 'points'];
      let placeholders = ['?', '?'];
      let values = [rewardData.user_id, rewardData.points];
      
      if (rewardData.transaction_id) {
        fields.push('transaction_id');
        placeholders.push('?');
        values.push(rewardData.transaction_id);
      }
      
      const query = `
        INSERT INTO rewards (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      const [result] = await pool.execute(query, values);
      
      // Get the newly created reward
      const [rewards] = await pool.execute(
        'SELECT * FROM rewards WHERE reward_id = ?',
        [result.insertId]
      );
      
      return rewards[0];
    } catch (error) {
      logger.error('Error creating reward:', error);
      throw new DatabaseError('Error creating reward');
    }
  }

  /**
   * Update reward (admin only)
   */
  static async updateReward(rewardId, data) {
    try {
      // Check if reward exists
      const [checkReward] = await pool.execute(
        'SELECT * FROM rewards WHERE reward_id = ?',
        [rewardId]
      );
      
      if (checkReward.length === 0) {
        throw new NotFoundError('Không tìm thấy thông tin điểm thưởng');
      }
      
      // Update reward
      const query = 'UPDATE rewards SET points = ? WHERE reward_id = ?';
      await pool.execute(query, [data.points, rewardId]);
      
      // Get updated reward
      const [rewards] = await pool.execute(
        'SELECT * FROM rewards WHERE reward_id = ?',
        [rewardId]
      );
      
      return rewards[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error updating reward (${rewardId}):`, error);
      throw new DatabaseError('Error updating reward');
    }
  }

  /**
   * Delete reward (admin only)
   */
  static async deleteReward(rewardId) {
    try {
      // Check if reward exists
      const [checkReward] = await pool.execute(
        'SELECT * FROM rewards WHERE reward_id = ?',
        [rewardId]
      );
      
      if (checkReward.length === 0) {
        throw new NotFoundError('Không tìm thấy thông tin điểm thưởng');
      }
      
      // Delete reward
      await pool.execute('DELETE FROM rewards WHERE reward_id = ?', [rewardId]);
      
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error deleting reward (${rewardId}):`, error);
      throw new DatabaseError('Error deleting reward');
    }
  }

  /**
   * Calculate and add reward points for a completed transaction
   */
  static async processTransactionReward(transactionId) {
    try {
      // Get transaction details
      const [transactions] = await pool.execute(
        `SELECT t.*, wt.unit_price
         FROM transactions t
         JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
         WHERE t.transaction_id = ? AND t.status = 'completed'`,
        [transactionId]
      );
      
      if (transactions.length === 0) {
        throw new NotFoundError('Không tìm thấy giao dịch hoặc giao dịch chưa hoàn thành');
      }
      
      const transaction = transactions[0];
      
      // Check if reward already exists for this transaction
      const [existingRewards] = await pool.execute(
        'SELECT * FROM rewards WHERE transaction_id = ?',
        [transactionId]
      );
      
      if (existingRewards.length > 0) {
        return existingRewards[0]; // Reward already exists
      }
      
      // Calculate points: quantity * unit_price
      const points = Math.floor(transaction.quantity * transaction.unit_price);
      
      // Create reward
      const rewardData = {
        user_id: transaction.user_id,
        transaction_id: transactionId,
        points
      };
      
      return await this.createReward(rewardData);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error processing transaction reward (${transactionId}):`, error);
      throw new DatabaseError('Error processing transaction reward');
    }
  }
}

module.exports = RewardRepository; 