const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const validator = require('validator');
const { 
  ValidationError, 
  AuthenticationError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidPasswordError,
  AccountInactiveError,
  AccountLockedError,  
  DuplicateError 
} = require('../utils/errors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const AuthValidator = require('../validators/authValidator');
const userRepository = require('../repositories/userRepository');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { createControllerLogger } = require('../utils/apiLogger');

// Tạo logger cho controller
const CONTROLLER_NAME = 'authController';
const apiLogger = createControllerLogger(CONTROLLER_NAME);

// Cấu hình nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const validateRegistrationData = (data) => {
  const errors = [];
  const { full_name, username, email, password, phone } = data;

  // Validate full_name
  if (!full_name) {
    errors.push('Họ tên không được để trống');
  } else if (full_name.length < 2 || full_name.length > 100) {
    errors.push('Họ tên phải từ 2 đến 100 ký tự');
  } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(full_name)) {
    errors.push('Họ tên chỉ được chứa chữ cái và khoảng trắng');
  }

  // Validate username
  if (!username) {
    errors.push('Username không được để trống');
  } else if (username.length < 3) {
    errors.push('Username phải có ít nhất 3 ký tự');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username chỉ được chứa chữ cái, số và dấu gạch dưới');
  }

  // Validate email
  if (!email) {
    errors.push('Email không được để trống');
  } else if (!validator.isEmail(email)) {
    errors.push('Email không đúng định dạng');
  }

  // Validate password
  if (!password) {
    errors.push('Mật khẩu không được để trống');
  } else if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
  }

  // Validate phone nếu có
  if (phone) {
    // Regex cho số điện thoại Việt Nam với các đầu số: 02, 03, 07, 08, 09
    const phoneRegex = /^(02|03|07|08|09)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      errors.push('Số điện thoại không hợp lệ. Số điện thoại phải bắt đầu bằng 02, 03, 07, 08, 09 và có 10 số');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('. '));
  }
};

// Thêm hằng số cho max login attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TIME = 15; // thời gian khóa tài khoản tính bằng phút

const authController = {
  // Đăng ký người dùng mới
  register: async (req, res, next) => {
    const FUNCTION_NAME = 'register';
    try {
      apiLogger.logFunction(FUNCTION_NAME, 'Bắt đầu đăng ký người dùng mới', req);
      
      if (!req.body) {
        apiLogger.logWarning(FUNCTION_NAME, 'Dữ liệu đăng ký trống', req);
        throw new ValidationError('Dữ liệu đăng ký không được để trống');
      }

      let { full_name, username, email, password, phone, address } = req.body;
      
      // Clean data
      full_name = full_name?.toString().trim();
      username = username?.toString().trim().toLowerCase();
      email = email?.toString().trim().toLowerCase();
      password = password?.toString();
      phone = phone?.toString().trim() || null;
      address = address?.toString().trim() || null;

      // Log về dữ liệu đăng ký (ẩn mật khẩu)
      apiLogger.logFunction(FUNCTION_NAME, 'Dữ liệu đăng ký đã được làm sạch', req, { 
        full_name, 
        username, 
        email, 
        phone, 
        address 
      });

      // Validate data
      AuthValidator.validateRegistrationData({ full_name, username, email, password, phone });

      // Create user
      const userId = await userRepository.createUser({
        full_name,
        username,
        email,
        password,
        phone,
        address
      });
      
      apiLogger.logFunction(FUNCTION_NAME, 'Người dùng đã được tạo thành công', req, { userId });

      // Check if this is the first user (admin)
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
      
      if (userCount[0].count === 1) {
        await userRepository.assignRole(userId, 1); // ADMIN role
        apiLogger.logFunction(FUNCTION_NAME, 'Đã gán quyền ADMIN cho người dùng đầu tiên', req, { userId });
      } else {
        const [userRoleCheck] = await pool.execute('SELECT role_id FROM roles WHERE name = "USER"');
        
        if (userRoleCheck.length > 0) {
          await userRepository.assignRole(userId, userRoleCheck[0].role_id);
        } else {
          const [insertRoleResult] = await pool.execute('INSERT INTO roles (name) VALUES ("USER")');
          await userRepository.assignRole(userId, insertRoleResult.insertId);
        }
        apiLogger.logFunction(FUNCTION_NAME, 'Đã gán quyền USER cho người dùng mới', req, { userId });
      }

      // Get user with roles
      const user = await userRepository.getUserWithRoles(userId);

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.user_id,
          username: user.username,
          roles: user.roles ? user.roles.split(',') : []
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      apiLogger.logFunction(FUNCTION_NAME, 'Đăng ký hoàn tất thành công', req, { 
        userId: user.user_id, 
        username: user.username 
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          user: {
            id: user.user_id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            roles: user.roles ? user.roles.split(',') : []
          },
          token
        }
      });
    } catch (error) {
      apiLogger.logError(FUNCTION_NAME, 'Đăng ký thất bại', req, error);
      next(error);
    }
  },

  // Đăng nhập
  login: async (req, res, next) => {
    const FUNCTION_NAME = 'login';
    let sanitizedUsername = '';
    try {
      apiLogger.logFunction(FUNCTION_NAME, 'Bắt đầu đăng nhập', req, { 
        ip: req.ip, 
        userAgent: req.get('User-Agent')
      });

      const { username, password } = req.body;
      
      // Kiểm tra và chuẩn hóa dữ liệu đầu vào
      if (!username || !password) {
        apiLogger.logWarning(FUNCTION_NAME, 'Thiếu thông tin đăng nhập', req);
        throw new ValidationError('Username và mật khẩu không được để trống');
      }
      
      sanitizedUsername = username.toString().trim().toLowerCase();

      // Validate login data
      AuthValidator.validateLoginData({ username: sanitizedUsername, password });

      // Find user
      const user = await userRepository.findByUsername(sanitizedUsername);
      
      if (!user) {
        apiLogger.logWarning(FUNCTION_NAME, 'Đăng nhập với username không tồn tại', req, { 
          username: sanitizedUsername 
        });
        throw new InvalidCredentialsError('Username hoặc mật khẩu không đúng');
      }

      // Kiểm tra status
      if (user.status !== 'active') {
        apiLogger.logWarning(FUNCTION_NAME, 'Đăng nhập với tài khoản không hoạt động', req, { 
          userId: user.user_id,
          username: user.username,
          status: user.status
        });
        throw new AuthenticationError('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        apiLogger.logWarning(FUNCTION_NAME, 'Đăng nhập với mật khẩu không đúng', req, {
          userId: user.user_id,
          username: user.username
        });
        throw new InvalidCredentialsError('Username hoặc mật khẩu không đúng');
      }

      // Get user with roles
      const userWithRoles = await userRepository.getUserWithRoles(user.user_id);

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: userWithRoles.user_id,
          username: userWithRoles.username,
          roles: userWithRoles.roles ? userWithRoles.roles.split(',') : []
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Log thành công
      apiLogger.logFunction(FUNCTION_NAME, 'Đăng nhập thành công', req, {
        userId: userWithRoles.user_id,
        username: userWithRoles.username,
        roles: userWithRoles.roles
      });

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: userWithRoles.user_id,
            full_name: userWithRoles.full_name,
            username: userWithRoles.username,
            email: userWithRoles.email,
            roles: userWithRoles.roles ? userWithRoles.roles.split(',') : []
          },
          token
        }
      });
    } catch (error) {
      apiLogger.logError(FUNCTION_NAME, 'Đăng nhập thất bại', req, error, { 
        username: sanitizedUsername 
      });
      next(error);
    }
  },

  // Thêm method mới vào authController
  getCurrentUser: async (req, res, next) => {
    const FUNCTION_NAME = 'getCurrentUser';
    try {
      apiLogger.logFunction(FUNCTION_NAME, 'Đang lấy thông tin người dùng hiện tại', req, {
        userId: req.user.userId
      });

      // Get basic user information
      const user = await userRepository.getUserWithRoles(req.user.userId);
      
      if (!user) {
        apiLogger.logWarning(FUNCTION_NAME, 'Người dùng không tồn tại', req, {
          userId: req.user.userId
        });
        throw new AuthenticationError('Người dùng không tồn tại');
      }

      // Get user's transactions summary
      const [transactionStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_transactions,
          SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified_transactions,
          SUM(quantity) as total_quantity
        FROM transactions 
        WHERE user_id = ?
      `, [user.user_id]);

      // Get user's reward information
      const [rewardStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_rewards,
          SUM(points) as total_points,
          MAX(earned_date) as last_reward_date
        FROM rewards 
        WHERE user_id = ?
      `, [user.user_id]);

      // Get user's latest transactions
      const [latestTransactions] = await pool.execute(`
        SELECT 
          t.transaction_id, t.status, t.quantity, t.transaction_date,
          cp.name as collection_point_name,
          wt.name as waste_type_name
        FROM transactions t
        LEFT JOIN collectionpoints cp ON t.collection_point_id = cp.collection_point_id
        LEFT JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC
        LIMIT 5
      `, [user.user_id]);

      // Get user's total waste types processed
      const [wasteTypeStats] = await pool.execute(`
        SELECT 
          wt.name as waste_type_name,
          SUM(t.quantity) as total_quantity
        FROM transactions t
        JOIN wastetypes wt ON t.waste_type_id = wt.waste_type_id
        WHERE t.user_id = ? AND t.status = 'completed'
        GROUP BY t.waste_type_id, wt.name
        ORDER BY total_quantity DESC
      `, [user.user_id]);

      // Get user's account information timestamps
      const [accountInfo] = await pool.execute(`
        SELECT 
          created_at,
          status,
          lock_until
        FROM users
        WHERE user_id = ?
      `, [user.user_id]);

      apiLogger.logFunction(FUNCTION_NAME, 'Lấy thông tin người dùng thành công', req, {
        userId: user.user_id,
        username: user.username,
        transactionCount: transactionStats[0].total_transactions 
      });

      // Build comprehensive response
      res.json({
        success: true,
        data: {
          // Basic user information
          basic_info: {
            id: user.user_id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            phone: user.phone || null,
            address: user.address || null,
            roles: user.roles ? user.roles.split(',') : []
          },
          // Account status information
          account_status: {
            status: user.status,
            created_at: accountInfo[0]?.created_at || null,
            lock_until: accountInfo[0]?.lock_until || null,
            login_attempts: user.login_attempts || 0
          },
          // Transaction statistics
          transaction_stats: transactionStats[0] || {
            total_transactions: 0,
            completed_transactions: 0,
            pending_transactions: 0,
            rejected_transactions: 0,
            verified_transactions: 0,
            total_quantity: 0
          },
          // Additional data section
          additional_data: {
            waste_type_stats: wasteTypeStats,
            reward_stats: rewardStats[0] || {
              total_rewards: 0,
              total_points: 0,
              last_reward_date: null
            },
            latest_transactions: latestTransactions
          },
          timezone: 'UTC+7'
        }
      });
    } catch (error) {
      apiLogger.logError(FUNCTION_NAME, 'Lấy thông tin người dùng thất bại', req, error);
      next(error);
    }
  },

  // Thêm method logout
  logout: async (req, res) => {
    const FUNCTION_NAME = 'logout';
    apiLogger.logFunction(FUNCTION_NAME, 'Người dùng đăng xuất', req, {
      userId: req.user?.userId
    });
    
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  },

  // Gửi yêu cầu reset password
  forgotPassword: async (req, res, next) => {
    const FUNCTION_NAME = 'forgotPassword';
    try {
      apiLogger.logFunction(FUNCTION_NAME, 'Yêu cầu đặt lại mật khẩu', req);
      
      const { email } = req.body;

      if (!email) {
        apiLogger.logWarning(FUNCTION_NAME, 'Thiếu email khi yêu cầu đặt lại mật khẩu', req);
        throw new ValidationError('Email không được để trống');
      }

      const user = await userRepository.findByEmail(email.toLowerCase());
      if (!user) {
        apiLogger.logWarning(FUNCTION_NAME, 'Email không tồn tại trong hệ thống', req, {
          email: email.toLowerCase()
        });
        throw new ValidationError('Email không tồn tại trong hệ thống');
      }

      const resetToken = await userRepository.createPasswordResetToken(user.user_id);
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      apiLogger.logFunction(FUNCTION_NAME, 'Đã gửi email đặt lại mật khẩu', req, {
        userId: user.user_id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Email đặt lại mật khẩu đã được gửi'
      });
    } catch (error) {
      apiLogger.logError(FUNCTION_NAME, 'Gửi yêu cầu đặt lại mật khẩu thất bại', req, error);
      next(error);
    }
  },

  // Reset password với token
  resetPassword: async (req, res, next) => {
    const FUNCTION_NAME = 'resetPassword';
    try {
      apiLogger.logFunction(FUNCTION_NAME, 'Bắt đầu đặt lại mật khẩu', req);
      
      const { token, password, confirmPassword } = req.body;

      if (!token) {
        apiLogger.logWarning(FUNCTION_NAME, 'Token không hợp lệ', req);
        throw new ValidationError('Token không hợp lệ');
      }

      AuthValidator.validatePasswordResetData({ password, confirmPassword });

      const resetToken = await userRepository.validatePasswordResetToken(token);
      if (!resetToken) {
        apiLogger.logWarning(FUNCTION_NAME, 'Token không hợp lệ hoặc đã hết hạn', req, {
          token: token
        });
        throw new ValidationError('Token không hợp lệ hoặc đã hết hạn');
      }

      await userRepository.updatePassword(resetToken.user_id, password);
      await userRepository.deletePasswordResetToken(token);

      apiLogger.logFunction(FUNCTION_NAME, 'Đặt lại mật khẩu thành công', req, {
        userId: resetToken.user_id
      });

      res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công'
      });
    } catch (error) {
      apiLogger.logError(FUNCTION_NAME, 'Đặt lại mật khẩu thất bại', req, error);
      next(error);
    }
  },

  // Đổi mật khẩu
  changePassword: async (req, res, next) => {
    const FUNCTION_NAME = 'changePassword';
    try {
      apiLogger.logFunction(FUNCTION_NAME, 'Bắt đầu đổi mật khẩu', req, {
        userId: req.user.userId
      });
      
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword) {
        apiLogger.logWarning(FUNCTION_NAME, 'Thiếu mật khẩu hiện tại', req);
        throw new ValidationError('Mật khẩu hiện tại không được để trống');
      }

      AuthValidator.validatePasswordResetData({ password: newPassword, confirmPassword });

      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        apiLogger.logWarning(FUNCTION_NAME, 'Người dùng không tồn tại', req, {
          userId: req.user.userId
        });
        throw new AuthenticationError('Người dùng không tồn tại');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        apiLogger.logWarning(FUNCTION_NAME, 'Mật khẩu hiện tại không đúng', req, {
          userId: user.user_id
        });
        throw new AuthenticationError('Mật khẩu hiện tại không đúng');
      }

      await userRepository.updatePassword(user.user_id, newPassword);

      apiLogger.logFunction(FUNCTION_NAME, 'Đổi mật khẩu thành công', req, {
        userId: user.user_id
      });

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      apiLogger.logError(FUNCTION_NAME, 'Đổi mật khẩu thất bại', req, error);
      next(error);
    }
  }
};

module.exports = authController; 