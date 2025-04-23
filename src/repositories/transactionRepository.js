const pool = require('../config/database');
const { NotFoundError, DatabaseError } = require('../utils/errors');
const logger = require('../utils/logger');

class TransactionRepository {
  /**
   * Get all transactions with pagination
   */
  static async getAllTransactions(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
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
      const whereConditions = [];
      const queryParams = [];
      
      if (filters.status) {
        whereConditions.push('t.status = ?');
        queryParams.push(filters.status);
      }
      
      if (filters.user_id) {
        whereConditions.push('t.user_id = ?');
        queryParams.push(filters.user_id);
      }
      
      if (filters.collection_point_id) {
        whereConditions.push('t.collection_point_id = ?');
        queryParams.push(filters.collection_point_id);
      }
      
      if (filters.waste_type_id) {
        whereConditions.push('t.waste_type_id = ?');
        queryParams.push(filters.waste_type_id);
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
      
      // Order by
      query += ' ORDER BY t.transaction_date DESC';
      
      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(Number(limit), Number(offset));
      
      // Execute query
      const [transactions] = await pool.execute(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM transactions t';
      
      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      const [totalCount] = await pool.execute(countQuery, queryParams.slice(0, -2));
      
      return {
        transactions,
        pagination: {
          total: totalCount[0].total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all transactions:', error);
      throw new DatabaseError('Error retrieving transactions');
    }
  }
  
  /**
   * Get user transactions
   */
  static async getUserTransactions(userId, page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      
      // Base query
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
        queryParams.push(filters.collection_point_id);
      }
      
      if (filters.waste_type_id) {
        query += ' AND t.waste_type_id = ?';
        queryParams.push(filters.waste_type_id);
      }
      
      if (filters.date_from) {
        query += ' AND t.transaction_date >= ?';
        queryParams.push(filters.date_from);
      }
      
      if (filters.date_to) {
        query += ' AND t.transaction_date <= ?';
        queryParams.push(filters.date_to);
      }
      
      // Order by
      query += ' ORDER BY t.transaction_date DESC';
      
      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(Number(limit), Number(offset));
      
      // Execute query
      const [transactions] = await pool.execute(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
      const countParams = [userId];
      
      if (filters.status) {
        countQuery += ' AND status = ?';
        countParams.push(filters.status);
      }
      
      if (filters.collection_point_id) {
        countQuery += ' AND collection_point_id = ?';
        countParams.push(filters.collection_point_id);
      }
      
      if (filters.waste_type_id) {
        countQuery += ' AND waste_type_id = ?';
        countParams.push(filters.waste_type_id);
      }
      
      if (filters.date_from) {
        countQuery += ' AND transaction_date >= ?';
        countParams.push(filters.date_from);
      }
      
      if (filters.date_to) {
        countQuery += ' AND transaction_date <= ?';
        countParams.push(filters.date_to);
      }
      
      const [totalCount] = await pool.execute(countQuery, countParams);
      
      return {
        transactions,
        pagination: {
          total: totalCount[0].total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user transactions:', error);
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
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if transaction exists
      const [transaction] = await connection.execute(
        'SELECT * FROM transactions WHERE transaction_id = ?',
        [transactionId]
      );
      
      if (transaction.length === 0) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      
      // Update transaction status
      await connection.execute(
        'UPDATE transactions SET status = ? WHERE transaction_id = ?',
        [status, transactionId]
      );
      
      // Add status to transaction history
      await connection.execute(
        'INSERT INTO transactionhistory (transaction_id, status) VALUES (?, ?)',
        [transactionId, status]
      );
      
      // If status is 'completed', add rewards
      if (status === 'completed') {
        const [wasteType] = await connection.execute(
          'SELECT unit_price FROM wastetypes WHERE waste_type_id = ?',
          [transaction[0].waste_type_id]
        );
        
        if (wasteType.length > 0) {
          const points = Math.floor(transaction[0].quantity * wasteType[0].unit_price);
          
          if (points > 0) {
            await connection.execute(
              'INSERT INTO rewards (user_id, transaction_id, points) VALUES (?, ?, ?)',
              [transaction[0].user_id, transactionId, points]
            );
          }
        }
      }
      
      await connection.commit();
      
      // Get the updated transaction
      return await this.getTransactionById(transactionId);
    } catch (error) {
      await connection.rollback();
      logger.error(`Error updating transaction status #${transactionId}:`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Không thể cập nhật trạng thái giao dịch: ' + error.message);
    } finally {
      connection.release();
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
      
      // Get transaction history
      const [history] = await pool.execute(
        'SELECT * FROM transactionhistory WHERE transaction_id = ? ORDER BY changed_at ASC',
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