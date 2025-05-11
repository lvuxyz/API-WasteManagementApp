const pool = require('../config/database');
const { NotFoundError, DatabaseError } = require('../utils/errors');
const logger = require('../utils/logger');

class TransactionRepository {
  /**
   * Get all transactions with pagination
   */
  static async getAllTransactions(page = 1, limit = 10, filters = {}) {
    try {
      // Validate and sanitize input
      const safePage = Math.max(1, parseInt(page));
      const safeLimit = Math.max(1, Math.min(50, parseInt(limit)));
      const offset = (safePage - 1) * safeLimit;
      
      // Base query
      let query = `
        SELECT t.*, u.full_name as user_name, u.username, 
               cp.name as collection_point_name, wt.name as waste_type_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.user_id
        LEFT JOIN collectionpoints cp ON t.collection_point_id = cp.collection_point_id
        LEFT JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
      `;
      
      // Add filters
      const queryParams = [];
      const whereConditions = [];
      
      if (filters.status) {
        whereConditions.push('t.status = ?');
        queryParams.push(filters.status);
      }
      
      if (filters.user_id) {
        whereConditions.push('t.user_id = ?');
        queryParams.push(parseInt(filters.user_id));
      }
      
      if (filters.collection_point_id) {
        whereConditions.push('t.collection_point_id = ?');
        queryParams.push(parseInt(filters.collection_point_id));
      }
      
      if (filters.waste_type_id) {
        whereConditions.push('t.waste_type_id = ?');
        queryParams.push(parseInt(filters.waste_type_id));
      }
      
      if (filters.date_from) {
        whereConditions.push('t.transaction_date >= ?');
        queryParams.push(filters.date_from);
      }
      
      if (filters.date_to) {
        whereConditions.push('t.transaction_date <= ?');
        queryParams.push(filters.date_to);
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      // Add order and pagination
      query += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
      queryParams.push(safeLimit, offset);
      
      // Execute query
      const [transactions] = await pool.query(query, queryParams);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM transactions t';
      const countParams = [];
      
      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ');
        countParams.push(...queryParams.slice(0, -2)); // Exclude limit and offset
      }
      
      const [totalCount] = await pool.query(countQuery, countParams);
      
      return {
        transactions: transactions.map(t => ({
          ...t,
          quantity: parseFloat(t.quantity)
        })),
        pagination: {
          total: parseInt(totalCount[0].total),
          page: safePage,
          limit: safeLimit,
          pages: Math.ceil(totalCount[0].total / safeLimit)
        }
      };
    } catch (error) {
      logger.error('Error getting all transactions:', error);
      throw new DatabaseError('Error retrieving transactions');
    }
  }
  
  /**
   * Get user transactions with filters and pagination
   * 
   * @param {number} userId - The ID of the user
   * @param {number} page - The page number (starts from 1)
   * @param {number} limit - Number of items per page
   * @param {object} filters - Filter options for transactions
   * @returns {object} Transactions and pagination information
   */
  static async getUserTransactions(userId, page = 1, limit = 10, filters = {}) {
    try {
      // Validate user ID
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Sanitize input
      const safePage = Math.max(1, parseInt(page));
      const safeLimit = Math.max(1, Math.min(50, parseInt(limit)));
      const offset = (safePage - 1) * safeLimit;
      
      // Base query with joins
      let query = `
        SELECT t.*, cp.name as collection_point_name, wt.name as waste_type_name
        FROM transactions t
        LEFT JOIN collectionpoints cp ON t.collection_point_id = cp.collection_point_id
        LEFT JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
        WHERE t.user_id = ?
      `;
      
      // Add filters
      const queryParams = [userId];
      
      if (filters.status) {
        query += ' AND t.status = ?';
        queryParams.push(filters.status);
      }
      
      if (filters.collection_point_id) {
        query += ' AND t.collection_point_id = ?';
        queryParams.push(parseInt(filters.collection_point_id) || 0);
      }
      
      if (filters.waste_type_id) {
        query += ' AND t.waste_type_id = ?';
        queryParams.push(parseInt(filters.waste_type_id) || 0);
      }
      
      if (filters.date_from) {
        query += ' AND t.transaction_date >= ?';
        queryParams.push(filters.date_from);
      }
      
      if (filters.date_to) {
        query += ' AND t.transaction_date <= ?';
        queryParams.push(filters.date_to);
      }
      
      // Add sorting and pagination
      query += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
      queryParams.push(safeLimit, offset);
      
      // Execute query
      const [transactions] = await pool.query(query, queryParams);
      
      // Get total count for pagination with same filters
      let countQuery = 'SELECT COUNT(*) as total FROM transactions t WHERE t.user_id = ?';
      const countParams = [userId];
      
      if (filters.status) {
        countQuery += ' AND t.status = ?';
        countParams.push(filters.status);
      }
      
      if (filters.collection_point_id) {
        countQuery += ' AND t.collection_point_id = ?';
        countParams.push(parseInt(filters.collection_point_id) || 0);
      }
      
      if (filters.waste_type_id) {
        countQuery += ' AND t.waste_type_id = ?';
        countParams.push(parseInt(filters.waste_type_id) || 0);
      }
      
      if (filters.date_from) {
        countQuery += ' AND t.transaction_date >= ?';
        countParams.push(filters.date_from);
      }
      
      if (filters.date_to) {
        countQuery += ' AND t.transaction_date <= ?';
        countParams.push(filters.date_to);
      }
      
      const [totalCount] = await pool.query(countQuery, countParams);
      const total = totalCount[0] ? parseInt(totalCount[0].total) : 0;
      
      return {
        // Convert decimal values to proper JavaScript numbers
        transactions: transactions.map(t => ({
          ...t,
          quantity: t.quantity !== null ? parseFloat(t.quantity) : null
        })),
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          pages: Math.ceil(total / safeLimit)
        }
      };
    } catch (error) {
      logger.error('Error getting user transactions:', error);
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        throw new DatabaseError('Invalid field in query');
      }
      if (error.code === 'ER_PARSE_ERROR') {
        throw new DatabaseError('SQL syntax error');
      }
      throw new DatabaseError('Error retrieving user transactions');
    }
  }
  
  /**
   * Get transaction by ID
   */
  static async getTransactionById(transactionId) {
    try {
      const [transaction] = await pool.execute(
        `SELECT t.*, u.full_name as user_name, u.username, 
                cp.name as collection_point_name, wt.name as waste_type_name
         FROM transactions t
         LEFT JOIN users u ON t.user_id = u.user_id
         LEFT JOIN collectionpoints cp ON t.collection_point_id = cp.collection_point_id
         LEFT JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
         WHERE t.transaction_id = ?`,
        [transactionId]
      );
      
      if (transaction.length === 0) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      
      return transaction[0];
    } catch (error) {
      logger.error(`Error getting transaction #${transactionId}:`, error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Error retrieving transaction');
    }
  }
  
  /**
   * Create new transaction
   */
  static async createTransaction(transactionData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Kiểm tra lại một lần nữa để đảm bảo không có giá trị undefined
      const sanitizedData = {
        user_id: transactionData.user_id || null,
        collection_point_id: transactionData.collection_point_id || null,
        waste_type_id: transactionData.waste_type_id || null,
        quantity: transactionData.quantity || null,
        unit: transactionData.unit || 'kg',
        proof_image_url: transactionData.proof_image_url || null
      };
      
      // Kiểm tra các giá trị bắt buộc
      if (!sanitizedData.user_id) {
        throw new Error('User ID là bắt buộc');
      }
      
      if (!sanitizedData.collection_point_id) {
        throw new Error('Collection point ID là bắt buộc');
      }
      
      if (!sanitizedData.waste_type_id) {
        throw new Error('Waste type ID là bắt buộc');
      }
      
      if (!sanitizedData.quantity) {
        throw new Error('Quantity là bắt buộc');
      }
      
      // Insert into transactions table
      const [result] = await connection.execute(
        `INSERT INTO transactions 
            (user_id, collection_point_id, waste_type_id, quantity, unit, proof_image_url) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sanitizedData.user_id,
          sanitizedData.collection_point_id,
          sanitizedData.waste_type_id,
          sanitizedData.quantity,
          sanitizedData.unit,
          sanitizedData.proof_image_url
        ]
      );
      
      const transactionId = result.insertId;
      
      // Add initial status to transaction history
      await connection.execute(
        `INSERT INTO transactionhistory (transaction_id, status) VALUES (?, ?)`,
        [transactionId, 'pending']
      );
      
      await connection.commit();
      
      // Get the created transaction
      return await this.getTransactionById(transactionId);
    } catch (error) {
      await connection.rollback();
      logger.error('Error creating transaction:', error);
      throw new DatabaseError('Không thể tạo giao dịch: ' + error.message);
    } finally {
      connection.release();
    }
  }
  
  /**
   * Update transaction
   */
  static async updateTransaction(transactionId, userId, data) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if transaction exists and belongs to user
      const [transaction] = await connection.execute(
        'SELECT * FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );
      
      if (transaction.length === 0) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      
      if (transaction[0].user_id !== userId) {
        throw new Error('Không có quyền cập nhật giao dịch này');
      }
      
      // Only allow updating pending transactions
      if (transaction[0].status !== 'pending') {
        throw new Error('Chỉ có thể cập nhật giao dịch đang chờ xử lý');
      }
      
      // Update transaction
      const updateFields = [];
      const updateValues = [];
      
      if (data.collection_point_id !== undefined) {
        updateFields.push('collection_point_id = ?');
        updateValues.push(data.collection_point_id);
      }
      
      if (data.waste_type_id !== undefined) {
        updateFields.push('waste_type_id = ?');
        updateValues.push(data.waste_type_id);
      }
      
      if (data.quantity !== undefined) {
        updateFields.push('quantity = ?');
        updateValues.push(data.quantity);
      }
      
      if (data.unit !== undefined) {
        updateFields.push('unit = ?');
        updateValues.push(data.unit);
      }
      
      if (data.proof_image_url !== undefined) {
        updateFields.push('proof_image_url = ?');
        updateValues.push(data.proof_image_url);
      }
      
      if (updateFields.length === 0) {
        throw new Error('Không có dữ liệu cập nhật');
      }
      
      // Add transaction ID to the update values
      updateValues.push(transactionId);
      
      await connection.execute(
        `UPDATE transactions SET ${updateFields.join(', ')} WHERE transaction_id = ?`,
        updateValues
      );
      
      await connection.commit();
      
      // Get the updated transaction
      return await this.getTransactionById(transactionId);
    } catch (error) {
      await connection.rollback();
      logger.error(`Error updating transaction #${transactionId}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Không thể cập nhật giao dịch: ' + error.message);
    } finally {
      connection.release();
    }
  }
  
  /**
   * Update transaction status
   */
  static async updateTransactionStatus(transactionId, status) {
    try {
      // Check if transaction exists
      const [transaction] = await pool.execute(
        'SELECT * FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );
      
      if (transaction.length === 0) {
        throw new NotFoundError('Không tìm thấy giao dịch');
      }
      
      // Update status
      await pool.execute(
        'UPDATE transactions SET status = ? WHERE transaction_id = ?',
        [status, transactionId]
      );
      
      // Record status change in history
      await pool.execute(
        'INSERT INTO transactionhistory (transaction_id, status) VALUES (?, ?)',
        [transactionId, status]
      );
      
      // If status is completed, process rewards
      if (status === 'completed') {
        try {
          // Dynamically import to avoid circular dependencies
          const RewardRepository = require('./rewardRepository');
          await RewardRepository.processTransactionReward(transactionId);
        } catch (rewardError) {
          logger.error(`Error processing reward for transaction ${transactionId}:`, rewardError);
          // We don't want to fail the transaction status update if reward processing fails
          // So we just log the error and continue
        }
      }
      
      // Get updated transaction
      const [updatedTransaction] = await pool.execute(
        `SELECT t.*, u.full_name as user_name, u.username, 
                cp.name as collection_point_name, wt.name as waste_type_name
         FROM transactions t
         LEFT JOIN users u ON t.user_id = u.user_id
         LEFT JOIN collectionpoints cp ON t.collection_point_id = cp.collection_point_id
         LEFT JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
         WHERE t.transaction_id = ?`,
        [transactionId]
      );
      
      return updatedTransaction[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`Error updating transaction status (${transactionId}):`, error);
      throw new DatabaseError('Error updating transaction status');
    }
  }
  
  /**
   * Delete transaction
   */
  static async deleteTransaction(transactionId, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if transaction exists and belongs to user
      const [transaction] = await connection.execute(
        'SELECT * FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );
      
      if (transaction.length === 0) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      
      if (transaction[0].user_id !== userId) {
        throw new Error('Không có quyền xóa giao dịch này');
      }
      
      // Only allow deleting pending transactions
      if (transaction[0].status !== 'pending') {
        throw new Error('Chỉ có thể xóa giao dịch đang chờ xử lý');
      }
      
      // Delete transaction history records
      await connection.execute(
        'DELETE FROM transactionhistory WHERE transaction_id = ?',
        [transactionId]
      );
      
      // Delete transaction
      await connection.execute(
        'DELETE FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`Error deleting transaction #${transactionId}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Không thể xóa giao dịch: ' + error.message);
    } finally {
      connection.release();
    }
  }
  
  /**
   * Get transaction history
   */
  static async getTransactionHistory(transactionId) {
    try {
      // Check if transaction exists
      const [transaction] = await pool.execute(
        'SELECT * FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );
      
      if (transaction.length === 0) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      
      // Get transaction history with Vietnam timezone (UTC+7)
      const [history] = await pool.execute(
        `SELECT 
          history_id, 
          transaction_id, 
          status, 
          CONVERT_TZ(changed_at, '+00:00', '+07:00') as changed_at 
        FROM transactionhistory 
        WHERE transaction_id = ? 
        ORDER BY changed_at ASC`,
        [transactionId]
      );
      
      return history;
    } catch (error) {
      logger.error(`Error getting transaction history #${transactionId}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Error retrieving transaction history');
    }
  }
}

module.exports = TransactionRepository; 