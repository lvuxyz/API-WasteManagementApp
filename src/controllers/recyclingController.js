const pool = require('../config/database');
const { ValidationError, NotFoundError, AuthorizationError } = require('../utils/errors');

// Hàm kiểm tra định dạng ngày tháng
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Validate recycling process data
const validateRecyclingData = (data) => {
  const errors = [];
  const { transaction_id, waste_type_id } = data;

  if (!transaction_id || isNaN(parseInt(transaction_id))) {
    errors.push('Transaction ID phải là số và không được để trống');
  }

  if (!waste_type_id || isNaN(parseInt(waste_type_id))) {
    errors.push('Waste Type ID phải là số và không được để trống');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('. '));
  }
};

// Validate update data
const validateUpdateData = (data) => {
  const errors = [];
  const { status, processed_quantity, end_date } = data;

  if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
    errors.push('Trạng thái không hợp lệ');
  }

  if (status === 'completed') {
    if (!processed_quantity) {
      errors.push('Số lượng xử lý không được để trống khi hoàn thành');
    }
    
    if (!end_date) {
      errors.push('Ngày kết thúc không được để trống khi hoàn thành');
    }
  }

  if (processed_quantity && (isNaN(processed_quantity) || parseFloat(processed_quantity) <= 0)) {
    errors.push('Số lượng xử lý phải là số dương');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('. '));
  }
};

const recyclingController = {
  // 0. Lấy toàn bộ danh sách quy trình tái chế (đơn giản)
  getAllRecyclingProcesses: async (req, res, next) => {
    try {
      const [rows] = await pool.execute(`
        SELECT rp.*, wt.name as waste_type_name
        FROM recyclingprocesses rp
        LEFT JOIN wastetypes wt ON rp.waste_type_id = wt.waste_type_id
      `);
      
      res.status(200).json({
        status: 'success',
        data: rows
      });
    } catch (error) {
      next(error);
    }
  },

  // 1. Lấy danh sách quá trình tái chế (có thể lọc)
  getRecyclingProcesses: async (req, res, next) => {
    try {
      const { status, waste_type_id, from, to } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Validate các tham số đầu vào
      if (page < 1) {
        throw new ValidationError('Số trang phải lớn hơn 0');
      }

      if (limit < 1 || limit > 100) {
        throw new ValidationError('Số lượng bản ghi mỗi trang phải từ 1 đến 100');
      }

      if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
        throw new ValidationError('Trạng thái không hợp lệ');
      }

      if (waste_type_id && isNaN(parseInt(waste_type_id))) {
        throw new ValidationError('ID loại chất thải phải là số');
      }

      if (from && !isValidDate(from)) {
        throw new ValidationError('Ngày bắt đầu không hợp lệ');
      }

      if (to && !isValidDate(to)) {
        throw new ValidationError('Ngày kết thúc không hợp lệ');
      }

      if (from && to && new Date(from) > new Date(to)) {
        throw new ValidationError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
      }

      let query = `
        SELECT 
          rp.process_id, 
          rp.transaction_id, 
          rp.waste_type_id, 
          rp.start_date, 
          rp.end_date, 
          rp.status, 
          rp.processed_quantity,
          wt.name as waste_type_name,
          wt.unit_price as waste_type_price,
          t.user_id,
          t.quantity as transaction_quantity,
          u.username as user_name,
          u.full_name as user_full_name,
          u.phone as user_phone
        FROM recyclingprocesses rp
        LEFT JOIN wastetypes wt ON rp.waste_type_id = wt.waste_type_id
        LEFT JOIN transactions t ON rp.transaction_id = t.transaction_id
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += ' AND rp.status = ?';
        params.push(status);
      }

      if (waste_type_id) {
        query += ' AND rp.waste_type_id = ?';
        params.push(waste_type_id);
      }

      if (from) {
        query += ' AND DATE(rp.start_date) >= ?';
        params.push(from);
      }

      if (to) {
        query += ' AND DATE(rp.start_date) <= ?';
        params.push(to);
      }

      // Thêm sắp xếp và giới hạn
      query += ' ORDER BY rp.start_date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // Thực hiện truy vấn
      const [recyclingProcesses] = await pool.execute(query, params);

      // Lấy tổng số bản ghi để phân trang
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM recyclingprocesses rp
        WHERE 1=1
      `;

      const countParams = [];

      if (status) {
        countQuery += ' AND rp.status = ?';
        countParams.push(status);
      }

      if (waste_type_id) {
        countQuery += ' AND rp.waste_type_id = ?';
        countParams.push(waste_type_id);
      }

      if (from) {
        countQuery += ' AND DATE(rp.start_date) >= ?';
        countParams.push(from);
      }

      if (to) {
        countQuery += ' AND DATE(rp.start_date) <= ?';
        countParams.push(to);
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      // Tính toán thông tin phân trang
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        status: 'success',
        data: {
          recyclingProcesses,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Tạo mới quá trình tái chế
  createRecyclingProcess: async (req, res, next) => {
    try {
      const { transaction_id, waste_type_id } = req.body;

      // Validate dữ liệu
      validateRecyclingData({ transaction_id, waste_type_id });

      // Kiểm tra giao dịch có tồn tại và hoàn thành không
      const [transaction] = await pool.execute(
        'SELECT * FROM transactions WHERE transaction_id = ? AND status = ?',
        [transaction_id, 'completed']
      );

      if (transaction.length === 0) {
        throw new ValidationError('Giao dịch không tồn tại hoặc chưa hoàn thành');
      }

      // Kiểm tra loại chất thải có tồn tại không
      const [wasteType] = await pool.execute(
        'SELECT * FROM wastetypes WHERE waste_type_id = ? AND recyclable = 1',
        [waste_type_id]
      );

      if (wasteType.length === 0) {
        throw new ValidationError('Loại chất thải không tồn tại hoặc không thể tái chế');
      }

      // Kiểm tra đã có quá trình tái chế cho giao dịch này chưa
      const [existingProcess] = await pool.execute(
        'SELECT * FROM recyclingprocesses WHERE transaction_id = ?',
        [transaction_id]
      );

      if (existingProcess.length > 0) {
        throw new ValidationError('Giao dịch này đã có quá trình tái chế');
      }

      // Tạo quá trình tái chế mới
      const [result] = await pool.execute(
        `INSERT INTO recyclingprocesses 
         (transaction_id, waste_type_id, start_date, status) 
         VALUES (?, ?, NOW(), 'pending')`,
        [transaction_id, waste_type_id]
      );

      const processId = result.insertId;

      // Lấy thông tin chi tiết quá trình tái chế vừa tạo
      const [newProcess] = await pool.execute(
        `SELECT rp.*, wt.name as waste_type_name, t.quantity as transaction_quantity
         FROM recyclingprocesses rp
         LEFT JOIN wastetypes wt ON rp.waste_type_id = wt.waste_type_id
         LEFT JOIN transactions t ON rp.transaction_id = t.transaction_id
         WHERE rp.process_id = ?`,
        [processId]
      );

      res.status(201).json({
        status: 'success',
        message: 'Khởi tạo quá trình tái chế thành công',
        data: newProcess[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Xem chi tiết quá trình tái chế
  getRecyclingProcessById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const [process] = await pool.execute(
        `SELECT rp.*, 
                wt.name as waste_type_name, 
                t.user_id, u.username as user_name, u.full_name as user_full_name,
                t.quantity as transaction_quantity
         FROM recyclingprocesses rp
         LEFT JOIN wastetypes wt ON rp.waste_type_id = wt.waste_type_id
         LEFT JOIN transactions t ON rp.transaction_id = t.transaction_id
         LEFT JOIN users u ON t.user_id = u.user_id
         WHERE rp.process_id = ?`,
        [id]
      );

      if (process.length === 0) {
        throw new NotFoundError('Không tìm thấy quá trình tái chế');
      }

      // Kiểm tra quyền truy cập: admin có thể xem tất cả, người dùng chỉ có thể xem của họ
      if (req.user.roles.includes('ADMIN') || req.user.id === process[0].user_id) {
        res.status(200).json({
          status: 'success',
          data: process[0]
        });
      } else {
        throw new AuthorizationError('Bạn không có quyền xem quá trình tái chế này');
      }
    } catch (error) {
      next(error);
    }
  },

  // 4. Cập nhật trạng thái & thông tin quá trình tái chế
  updateRecyclingProcess: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, processed_quantity, end_date } = req.body;

      // Validate dữ liệu cập nhật
      validateUpdateData({ status, processed_quantity, end_date });

      // Kiểm tra quá trình tái chế có tồn tại không
      const [process] = await pool.execute(
        'SELECT * FROM recyclingprocesses WHERE process_id = ?',
        [id]
      );

      if (process.length === 0) {
        throw new NotFoundError('Không tìm thấy quá trình tái chế');
      }

      // Chuẩn bị câu query cập nhật
      let query = 'UPDATE recyclingprocesses SET';
      const params = [];
      const updates = [];

      if (status) {
        updates.push(' status = ?');
        params.push(status);
        
        // Nếu chuyển sang in_progress và chưa có start_date
        if (status === 'in_progress' && !process[0].start_date) {
          updates.push(' start_date = NOW()');
        }
        
        // Nếu hoàn thành và chưa có end_date
        if (status === 'completed' && !end_date) {
          updates.push(' end_date = NOW()');
        }
      }

      if (processed_quantity) {
        updates.push(' processed_quantity = ?');
        params.push(processed_quantity);
      }

      if (end_date) {
        updates.push(' end_date = ?');
        params.push(end_date);
      }

      // Nếu không có gì cập nhật
      if (updates.length === 0) {
        throw new ValidationError('Không có thông tin nào được cập nhật');
      }

      // Hoàn thiện câu query
      query += updates.join(',');
      query += ' WHERE process_id = ?';
      params.push(id);

      // Thực hiện cập nhật
      await pool.execute(query, params);

      res.status(200).json({
        status: 'success',
        message: 'Cập nhật quá trình tái chế thành công'
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Thống kê quá trình tái chế
  getRecyclingReport: async (req, res, next) => {
    try {
      const { from, to, period = 'monthly' } = req.query;
      
      // Xác định format ngày tháng dựa trên period
      let dateFormat;
      let groupBy;
      
      switch (period) {
        case 'daily':
          dateFormat = '%Y-%m-%d';
          groupBy = 'DATE(start_date)';
          break;
        case 'weekly':
          dateFormat = '%Y-%u'; // Năm-tuần
          groupBy = 'YEARWEEK(start_date)';
          break;
        case 'monthly':
          dateFormat = '%Y-%m';
          groupBy = 'YEAR(start_date), MONTH(start_date)';
          break;
        case 'yearly':
        default:
          dateFormat = '%Y';
          groupBy = 'YEAR(start_date)';
          break;
      }

      // Chuẩn bị điều kiện thời gian
      let timeCondition = '';
      const params = [];
      
      if (from && to) {
        timeCondition = 'WHERE start_date BETWEEN ? AND ?';
        params.push(from, to);
      } else if (from) {
        timeCondition = 'WHERE start_date >= ?';
        params.push(from);
      } else if (to) {
        timeCondition = 'WHERE start_date <= ?';
        params.push(to);
      }

      // 1. Tổng số lượng xử lý
      const [totalProcessed] = await pool.execute(`
        SELECT SUM(processed_quantity) as total_processed
        FROM recyclingprocesses
        WHERE status = 'completed' ${timeCondition ? 'AND ' + timeCondition.substring(6) : ''}
      `, params);

      // 2. Thống kê theo loại chất thải
      const [byType] = await pool.execute(`
        SELECT wt.name as waste_type, SUM(rp.processed_quantity) as total_quantity
        FROM recyclingprocesses rp
        JOIN wastetypes wt ON rp.waste_type_id = wt.waste_type_id
        ${timeCondition}
        AND rp.status = 'completed'
        GROUP BY rp.waste_type_id
      `, params);

      // 3. Thống kê theo trạng thái
      const [byStatus] = await pool.execute(`
        SELECT status, COUNT(*) as count
        FROM recyclingprocesses
        ${timeCondition}
        GROUP BY status
      `, params);

      // 4. Xu hướng theo thời gian
      const [byTimePeriod] = await pool.execute(`
        SELECT 
          DATE_FORMAT(start_date, '${dateFormat}') as period,
          SUM(processed_quantity) as processed_quantity,
          COUNT(*) as total_processes
        FROM recyclingprocesses
        ${timeCondition}
        AND status = 'completed'
        GROUP BY ${groupBy}
        ORDER BY period
      `, params);

      // Tạo đối tượng kết quả
      const byTypeObj = {};
      byType.forEach(item => {
        byTypeObj[item.waste_type] = item.total_quantity;
      });

      const byStatusObj = {};
      byStatus.forEach(item => {
        byStatusObj[item.status] = item.count;
      });

      res.status(200).json({
        status: 'success',
        data: {
          total_processed: totalProcessed[0].total_processed || 0,
          by_type: byTypeObj,
          by_status: byStatusObj,
          trends: byTimePeriod
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // 6. Lấy danh sách quá trình tái chế theo người dùng
  getUserRecyclingProcesses: async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Kiểm tra quyền: admin có thể xem tất cả, người dùng chỉ có thể xem của họ
      if (!req.user.roles.includes('ADMIN') && req.user.id !== parseInt(userId)) {
        throw new AuthorizationError('Bạn không có quyền xem quá trình tái chế của người dùng khác');
      }

      const [processes] = await pool.execute(`
        SELECT rp.process_id, rp.transaction_id, rp.status, 
               rp.start_date, rp.end_date, rp.processed_quantity,
               wt.name as waste_type
        FROM recyclingprocesses rp
        JOIN transactions t ON rp.transaction_id = t.transaction_id
        JOIN wastetypes wt ON rp.waste_type_id = wt.waste_type_id
        WHERE t.user_id = ?
        ORDER BY rp.start_date DESC
      `, [userId]);

      res.status(200).json({
        status: 'success',
        data: processes
      });
    } catch (error) {
      next(error);
    }
  },

  // 7. Gửi thông báo cập nhật quá trình tái chế
  sendRecyclingNotification: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, message } = req.body;

      // Kiểm tra quá trình tái chế có tồn tại không
      const [process] = await pool.execute(`
        SELECT rp.*, t.user_id
        FROM recyclingprocesses rp
        JOIN transactions t ON rp.transaction_id = t.transaction_id
        WHERE rp.process_id = ?
      `, [id]);

      if (process.length === 0) {
        throw new NotFoundError('Không tìm thấy quá trình tái chế');
      }

      // Kiểm tra user_id có tồn tại không
      const userId = process[0].user_id;
      if (!userId) {
        throw new ValidationError('Không tìm thấy người dùng liên quan đến quá trình tái chế này');
      }

      // TODO: Tích hợp với hệ thống thông báo thực tế ở đây
      // Ví dụ: gửi email, push notification hoặc lưu vào bảng thông báo

      // Vì đây là ví dụ, tạm thời chỉ log ra và trả về thành công
      console.log(`Sending notification to user ${userId}: ${title} - ${message}`);

      res.status(200).json({
        status: 'success',
        message: 'Đã gửi thông báo thành công'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = recyclingController; 