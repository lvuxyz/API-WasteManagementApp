const transactionRepository = require('../repositories/transactionRepository');
const TransactionValidator = require('../validators/transactionValidator');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');

const transactionController = {
  /**
   * Get all transactions (admin only)
   */
  getAllTransactions: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Extract filters from query params
      const filters = {
        status: req.query.status,
        user_id: req.query.user_id ? parseInt(req.query.user_id) : undefined,
        collection_point_id: req.query.collection_point_id ? parseInt(req.query.collection_point_id) : undefined,
        waste_type_id: req.query.waste_type_id ? parseInt(req.query.waste_type_id) : undefined,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };
      
      const result = await transactionRepository.getAllTransactions(page, limit, filters);
      
      res.json({
        success: true,
        message: 'Lấy danh sách giao dịch thành công',
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getAllTransactions:', error);
      next(error);
    }
  },
  
  /**
   * Get user's transactions
   */
  getUserTransactions: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      // Extract filters from query params
      const filters = {
        status: req.query.status,
        collection_point_id: req.query.collection_point_id ? parseInt(req.query.collection_point_id) : undefined,
        waste_type_id: req.query.waste_type_id ? parseInt(req.query.waste_type_id) : undefined,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };
      
      const result = await transactionRepository.getUserTransactions(userId, page, limit, filters);
      
      res.json({
        success: true,
        message: 'Lấy danh sách giao dịch của bạn thành công',
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error in getUserTransactions:', error);
      next(error);
    }
  },
  
  /**
   * Get transaction by ID
   */
  getTransactionById: async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.user.userId;
      const isAdmin = req.user.roles.includes('ADMIN');
      
      const transaction = await transactionRepository.getTransactionById(transactionId);
      
      // Check if transaction belongs to user or user is admin
      if (transaction.user_id !== userId && !isAdmin) {
        throw new AuthorizationError('Bạn không có quyền xem giao dịch này');
      }
      
      res.json({
        success: true,
        message: 'Lấy thông tin giao dịch thành công',
        data: transaction
      });
    } catch (error) {
      logger.error(`Error in getTransactionById (${req.params.id}):`, error);
      next(error);
    }
  },
  
  /**
   * Create new transaction
   */
  createTransaction: async (req, res, next) => {
    try {
      // Kiểm tra xem user đã được xác thực chưa
      if (!req.user || !req.user.userId) {
        throw new AuthorizationError('Bạn cần đăng nhập để thực hiện thao tác này');
      }
      
      const userId = req.user.userId;
      
      // Validate request data
      TransactionValidator.validateCreateTransaction(req.body);
      
      // Đảm bảo tất cả các giá trị đều tồn tại và có kiểu dữ liệu đúng
      const transactionData = {
        user_id: userId,
        collection_point_id: req.body.collection_point_id ? parseInt(req.body.collection_point_id) : null,
        waste_type_id: req.body.waste_type_id ? parseInt(req.body.waste_type_id) : null,
        quantity: req.body.quantity ? parseFloat(req.body.quantity) : null,
        unit: req.body.unit || 'kg',
        proof_image_url: req.body.proof_image_url || null
      };
      
      // Kiểm tra lại một lần nữa để đảm bảo không có giá trị undefined
      Object.keys(transactionData).forEach(key => {
        if (transactionData[key] === undefined) {
          transactionData[key] = null;
        }
      });
      
      const transaction = await transactionRepository.createTransaction(transactionData);
      
      res.status(201).json({
        success: true,
        message: 'Tạo giao dịch thành công',
        data: transaction
      });
    } catch (error) {
      logger.error('Error in createTransaction:', error);
      next(error);
    }
  },
  
  /**
   * Update transaction
   */
  updateTransaction: async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.user.userId;
      
      // Validate request data
      TransactionValidator.validateUpdateTransaction(req.body);
      
      const updateData = {};
      
      if (req.body.collection_point_id !== undefined) {
        updateData.collection_point_id = parseInt(req.body.collection_point_id);
      }
      
      if (req.body.waste_type_id !== undefined) {
        updateData.waste_type_id = parseInt(req.body.waste_type_id);
      }
      
      if (req.body.quantity !== undefined) {
        updateData.quantity = parseFloat(req.body.quantity);
      }
      
      if (req.body.unit !== undefined) {
        updateData.unit = req.body.unit;
      }
      
      if (req.body.proof_image_url !== undefined) {
        updateData.proof_image_url = req.body.proof_image_url;
      }
      
      const transaction = await transactionRepository.updateTransaction(transactionId, userId, updateData);
      
      res.json({
        success: true,
        message: 'Cập nhật giao dịch thành công',
        data: transaction
      });
    } catch (error) {
      logger.error(`Error in updateTransaction (${req.params.id}):`, error);
      next(error);
    }
  },
  
  /**
   * Update transaction status (admin only)
   */
  updateTransactionStatus: async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      // Validate request data
      TransactionValidator.validateStatusUpdate(req.body);
      
      const status = req.body.status;
      
      const transaction = await transactionRepository.updateTransactionStatus(transactionId, status);
      
      res.json({
        success: true,
        message: 'Cập nhật trạng thái giao dịch thành công',
        data: transaction
      });
    } catch (error) {
      logger.error(`Error in updateTransactionStatus (${req.params.id}):`, error);
      next(error);
    }
  },
  
  /**
   * Delete transaction
   */
  deleteTransaction: async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.user.userId;
      
      await transactionRepository.deleteTransaction(transactionId, userId);
      
      res.json({
        success: true,
        message: 'Xóa giao dịch thành công'
      });
    } catch (error) {
      logger.error(`Error in deleteTransaction (${req.params.id}):`, error);
      next(error);
    }
  },
  
  /**
   * Get transaction history
   */
  getTransactionHistory: async (req, res, next) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.user.userId;
      const isAdmin = req.user.roles.includes('ADMIN');
      
      // Check if transaction belongs to user or user is admin
      const transaction = await transactionRepository.getTransactionById(transactionId);
      
      if (transaction.user_id !== userId && !isAdmin) {
        throw new AuthorizationError('Bạn không có quyền xem lịch sử giao dịch này');
      }
      
      const history = await transactionRepository.getTransactionHistory(transactionId);
      
      res.json({
        success: true,
        message: 'Lấy lịch sử giao dịch thành công',
        data: history
      });
    } catch (error) {
      logger.error(`Error in getTransactionHistory (${req.params.id}):`, error);
      next(error);
    }
  }
};

module.exports = transactionController; 