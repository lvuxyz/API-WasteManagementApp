const pool = require('../config/database');
const { ValidationError, NotFoundError, AuthorizationError } = require('../utils/errors');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// Validate transaction data
const validateTransactionData = (data) => {
  const errors = [];
  const { user_id, collection_point_id, waste_type_id, quantity, unit } = data;

  // Validate user_id
  if (!user_id) {
    errors.push('User ID không được để trống');
  }

  // Validate collection_point_id
  if (!collection_point_id) {
    errors.push('Collection point ID không được để trống');
  }

  // Validate waste_type_id
  if (!waste_type_id) {
    errors.push('Waste type ID không được để trống');
  }

  // Validate quantity
  if (!quantity) {
    errors.push('Số lượng không được để trống');
  } else if (isNaN(quantity) || parseFloat(quantity) <= 0) {
    errors.push('Số lượng phải là số dương');
  }

  // Validate unit (optional validation)
  if (unit && typeof unit !== 'string') {
    errors.push('Đơn vị phải là chuỗi');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('. '));
  }
};

// Helper function to save an image
const saveImage = async (base64Image, userId, transactionId) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads');
    const userDir = path.join(uploadsDir, `user_${userId}`);
    const transactionDir = path.join(userDir, `transaction_${transactionId}`);
    
    try {
      if (!fs.existsSync(uploadsDir)) {
        await mkdirAsync(uploadsDir);
      }
      if (!fs.existsSync(userDir)) {
        await mkdirAsync(userDir);
      }
      if (!fs.existsSync(transactionDir)) {
        await mkdirAsync(transactionDir);
      }
    } catch (err) {
      console.error('Error creating directories:', err);
      throw new Error('Cannot create upload directories');
    }

    // Remove header from base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    // Create file name and path
    const fileName = `proof_${Date.now()}.jpg`;
    const filePath = path.join(transactionDir, fileName);
    
    // Save the file
    await writeFileAsync(filePath, base64Data, { encoding: 'base64' });
    
    // Return the relative path to save in database
    return `/uploads/user_${userId}/transaction_${transactionId}/${fileName}`;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image');
  }
};

const transactionController = {
  // Tạo giao dịch mới
  createTransaction: async (req, res, next) => {
    try {
      const { user_id, collection_point_id, waste_type_id, quantity, unit = 'kg', proof_image_url } = req.body;

      // Validate dữ liệu đầu vào
      if (!user_id || !collection_point_id || !waste_type_id || !quantity) {
        throw new ValidationError('Thiếu thông tin bắt buộc');
      }

      if (isNaN(quantity) || parseFloat(quantity) <= 0) {
        throw new ValidationError('Số lượng phải là số dương');
      }

      // Kiểm tra điểm thu gom có tồn tại và đang hoạt động
      const [collectionPoint] = await pool.execute(
        'SELECT * FROM CollectionPoints WHERE collection_point_id = ? AND status = "active"',
        [collection_point_id]
      );

      if (collectionPoint.length === 0) {
        throw new NotFoundError('Điểm thu gom không tồn tại hoặc không hoạt động');
      }

      // Kiểm tra loại chất thải có tồn tại
      const [wasteType] = await pool.execute(
        'SELECT * FROM WasteTypes WHERE waste_type_id = ?',
        [waste_type_id]
      );

      if (wasteType.length === 0) {
        throw new NotFoundError('Loại chất thải không tồn tại');
      }

      // Tạo giao dịch mới
      const [result] = await pool.execute(
        `INSERT INTO Transactions 
         (user_id, collection_point_id, waste_type_id, quantity, unit, transaction_date, status, proof_image_url)
         VALUES (?, ?, ?, ?, ?, NOW(), 'pending', ?)`,
        [user_id, collection_point_id, waste_type_id, quantity, unit, proof_image_url]
      );

      const transactionId = result.insertId;

      // Thêm vào lịch sử giao dịch
      await pool.execute(
        'INSERT INTO TransactionHistory (transaction_id, status) VALUES (?, "pending")',
        [transactionId]
      );

      // Lấy thông tin giao dịch vừa tạo
      const [newTransaction] = await pool.execute(
        `SELECT t.*, 
                u.username as user_name,
                cp.name as collection_point_name,
                wt.name as waste_type_name
         FROM Transactions t
         LEFT JOIN Users u ON t.user_id = u.user_id
         LEFT JOIN CollectionPoints cp ON t.collection_point_id = cp.collection_point_id
         LEFT JOIN WasteTypes wt ON t.waste_type_id = wt.waste_type_id
         WHERE t.transaction_id = ?`,
        [transactionId]
      );

      res.status(201).json({
        status: 'success',
        data: newTransaction[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách giao dịch (phân trang)
  getTransactions: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      let query = `
        SELECT t.*, 
               u.username as user_name,
               cp.name as collection_point_name,
               wt.name as waste_type_name
        FROM Transactions t
        LEFT JOIN Users u ON t.user_id = u.user_id
        LEFT JOIN CollectionPoints cp ON t.collection_point_id = cp.collection_point_id
        LEFT JOIN WasteTypes wt ON t.waste_type_id = wt.waste_type_id
      `;

      const params = [];

      if (status) {
        query += ' WHERE t.status = ?';
        params.push(status);
      }

      query += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // Lấy tổng số giao dịch
      const [totalCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM Transactions' + (status ? ' WHERE status = ?' : ''),
        status ? [status] : []
      );

      const [transactions] = await pool.execute(query, params);

      res.status(200).json({
        status: 'success',
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            totalPages: Math.ceil(totalCount[0].count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Lấy chi tiết giao dịch theo ID
  getTransactionById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const [transaction] = await pool.execute(
        `SELECT t.*, 
                u.username as user_name,
                u.full_name as user_full_name,
                cp.name as collection_point_name,
                wt.name as waste_type_name
         FROM Transactions t
         LEFT JOIN Users u ON t.user_id = u.user_id
         LEFT JOIN CollectionPoints cp ON t.collection_point_id = cp.collection_point_id
         LEFT JOIN WasteTypes wt ON t.waste_type_id = wt.waste_type_id
         WHERE t.transaction_id = ?`,
        [id]
      );

      if (transaction.length === 0) {
        throw new NotFoundError('Không tìm thấy giao dịch');
      }

      // Lấy lịch sử trạng thái giao dịch
      const [history] = await pool.execute(
        'SELECT * FROM TransactionHistory WHERE transaction_id = ? ORDER BY changed_at ASC',
        [id]
      );

      res.status(200).json({
        status: 'success',
        data: {
          ...transaction[0],
          history
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật trạng thái giao dịch
  updateTransactionStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate trạng thái
      if (!['pending', 'verified', 'completed', 'rejected'].includes(status)) {
        throw new ValidationError('Trạng thái không hợp lệ');
      }

      // Kiểm tra giao dịch tồn tại
      const [transaction] = await pool.execute(
        'SELECT * FROM Transactions WHERE transaction_id = ?',
        [id]
      );

      if (transaction.length === 0) {
        throw new NotFoundError('Không tìm thấy giao dịch');
      }

      // Cập nhật trạng thái giao dịch
      await pool.execute(
        'UPDATE Transactions SET status = ? WHERE transaction_id = ?',
        [status, id]
      );

      // Thêm vào lịch sử
      await pool.execute(
        'INSERT INTO TransactionHistory (transaction_id, status) VALUES (?, ?)',
        [id, status]
      );

      // Nếu giao dịch hoàn thành, tạo điểm thưởng
      if (status === 'completed') {
        const wasteType = transaction[0].waste_type_id;
        const quantity = transaction[0].quantity;
        const userId = transaction[0].user_id;

        // Lấy giá trị điểm cho loại chất thải
        const [wasteTypeInfo] = await pool.execute(
          'SELECT unit_price FROM WasteTypes WHERE waste_type_id = ?',
          [wasteType]
        );

        if (wasteTypeInfo.length > 0) {
          const points = Math.floor(quantity * (wasteTypeInfo[0].unit_price || 1));
          
          // Thêm điểm thưởng
          await pool.execute(
            'INSERT INTO Rewards (user_id, transaction_id, points, earned_date) VALUES (?, ?, ?, NOW())',
            [userId, id, points]
          );
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Cập nhật trạng thái giao dịch thành công'
      });
    } catch (error) {
      next(error);
    }
  },

  // Lấy lịch sử giao dịch của người dùng
  getUserTransactions: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      let query = `
        SELECT t.*, 
               cp.name as collection_point_name,
               wt.name as waste_type_name
        FROM Transactions t
        LEFT JOIN CollectionPoints cp ON t.collection_point_id = cp.collection_point_id
        LEFT JOIN WasteTypes wt ON t.waste_type_id = wt.waste_type_id
        WHERE t.user_id = ?
      `;

      const params = [userId];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }

      query += ' ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // Lấy tổng số giao dịch của người dùng
      const [totalCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM Transactions WHERE user_id = ?' + (status ? ' AND status = ?' : ''),
        status ? [userId, status] : [userId]
      );

      const [transactions] = await pool.execute(query, params);

      res.status(200).json({
        status: 'success',
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            totalPages: Math.ceil(totalCount[0].count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get transaction history
  getTransactionHistory: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Check if transaction exists
      const [transaction] = await pool.execute(
        'SELECT * FROM Transactions WHERE transaction_id = ?',
        [id]
      );
      
      if (transaction.length === 0) {
        throw new NotFoundError('Giao dịch không tồn tại');
      }
      
      // Get transaction history
      const [history] = await pool.execute(
        `SELECT * FROM TransactionHistory 
         WHERE transaction_id = ? 
         ORDER BY changed_at ASC`,
        [id]
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          transaction_id: id,
          history
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get transaction statistics
  getTransactionStatistics: async (req, res, next) => {
    try {
      const { period = 'monthly' } = req.query; // daily, weekly, monthly, yearly
      let dateFormat;
      let groupBy;
      
      switch (period) {
        case 'daily':
          dateFormat = '%Y-%m-%d';
          groupBy = 'DATE(transaction_date)';
          break;
        case 'weekly':
          dateFormat = '%Y-%u'; // Year and week number
          groupBy = 'YEARWEEK(transaction_date)';
          break;
        case 'monthly':
          dateFormat = '%Y-%m';
          groupBy = 'YEAR(transaction_date), MONTH(transaction_date)';
          break;
        case 'yearly':
        default:
          dateFormat = '%Y';
          groupBy = 'YEAR(transaction_date)';
          break;
      }
      
      // Get transaction counts by status
      const [statusStats] = await pool.execute(`
        SELECT
          status,
          COUNT(*) as count,
          DATE_FORMAT(transaction_date, '${dateFormat}') as period
        FROM Transactions
        GROUP BY ${groupBy}, status
        ORDER BY transaction_date DESC
        LIMIT 30
      `);
      
      // Get waste type statistics
      const [wasteStats] = await pool.execute(`
        SELECT
          wt.name as waste_type,
          SUM(t.quantity) as total_quantity,
          DATE_FORMAT(t.transaction_date, '${dateFormat}') as period
        FROM Transactions t
        JOIN WasteTypes wt ON t.waste_type_id = wt.waste_type_id
        WHERE t.status = 'completed'
        GROUP BY ${groupBy}, t.waste_type_id
        ORDER BY t.transaction_date DESC
        LIMIT 30
      `);
      
      res.status(200).json({
        status: 'success',
        data: {
          status_statistics: statusStats,
          waste_statistics: wasteStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = transactionController; 