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
    try {
      if (!req.body) {
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

      // Check if this is the first user (admin)
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM Users');
      
      if (userCount[0].count === 1) {
        await userRepository.assignRole(userId, 1); // ADMIN role
      } else {
        const [userRoleCheck] = await pool.execute('SELECT role_id FROM Roles WHERE name = "USER"');
        
        if (userRoleCheck.length > 0) {
          await userRepository.assignRole(userId, userRoleCheck[0].role_id);
        } else {
          const [insertRoleResult] = await pool.execute('INSERT INTO Roles (name) VALUES ("USER")');
          await userRepository.assignRole(userId, insertRoleResult.insertId);
        }
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
      logger.error('Registration error:', error);
      next(error);
    }
  },

  // Đăng nhập
  login: async (req, res, next) => {
    let sanitizedUsername = '';
    try {
      logger.info('Login attempt', { 
        ip: req.ip, 
        userAgent: req.get('User-Agent')
      });

      const { username, password } = req.body;
      
      // Kiểm tra và chuẩn hóa dữ liệu đầu vào
      if (!username || !password) {
        logger.warn('Login attempt with missing credentials');
        throw new ValidationError('Username và mật khẩu không được để trống');
      }
      
      sanitizedUsername = username.toString().trim().toLowerCase();

      // Validate login data
      AuthValidator.validateLoginData({ username: sanitizedUsername, password });

      // Find user
      const user = await userRepository.findByUsername(sanitizedUsername);
      
      if (!user) {
        logger.warn('Login attempt with non-existent username', { 
          username: sanitizedUsername 
        });
        throw new InvalidCredentialsError('Username hoặc mật khẩu không đúng');
      }

      // Kiểm tra status
      if (user.status !== 'active') {
        logger.warn('Inactive account login attempt', { 
          userId: user.user_id,
          username: user.username,
          status: user.status
        });
        throw new AuthenticationError('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        logger.warn('Invalid password login attempt', {
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
      logger.info('Login successful', {
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
      // Log lỗi chi tiết
      logger.error('Login failed', { 
        username: sanitizedUsername,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      });
      
      next(error);
    }
  },

  // Thêm method mới vào authController
  getCurrentUser: async (req, res, next) => {
    try {
      // Get basic user information
      const user = await userRepository.getUserWithRoles(req.user.userId);
      
      if (!user) {
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
        FROM Users
        WHERE user_id = ?
      `, [user.user_id]);

      // Build comprehensive response
      res.json({
        success: true,
        data: {
          user: {
            id: user.user_id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            phone: user.phone || null,
            address: user.address || null,
            roles: user.roles ? user.roles.split(',') : [],
            account_status: user.status,
            created_at: accountInfo[0]?.created_at || null,
            lock_until: accountInfo[0]?.lock_until || null
          },
          transaction_stats: transactionStats[0] || {
            total_transactions: 0,
            completed_transactions: 0,
            pending_transactions: 0,
            rejected_transactions: 0,
            verified_transactions: 0,
            total_quantity: 0
          },
          reward_stats: rewardStats[0] || {
            total_rewards: 0,
            total_points: 0,
            last_reward_date: null
          },
          latest_transactions: latestTransactions,
          waste_type_stats: wasteTypeStats,
          timezone: 'UTC+7'
        }
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      next(error);
    }
  },

  // Thêm method logout
  logout: async (req, res) => {
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  },

  // Gửi yêu cầu reset password
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email không được để trống');
      }

      const user = await userRepository.findByEmail(email.toLowerCase());
      if (!user) {
        throw new ValidationError('Email không tồn tại trong hệ thống');
      }

      const resetToken = await userRepository.createPasswordResetToken(user.user_id);
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.json({
        success: true,
        message: 'Email đặt lại mật khẩu đã được gửi'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  },

  // Reset password với token
  resetPassword: async (req, res, next) => {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token) {
        throw new ValidationError('Token không hợp lệ');
      }

      AuthValidator.validatePasswordResetData({ password, confirmPassword });

      const resetToken = await userRepository.validatePasswordResetToken(token);
      if (!resetToken) {
        throw new ValidationError('Token không hợp lệ hoặc đã hết hạn');
      }

      await userRepository.updatePassword(resetToken.user_id, password);
      await userRepository.deletePasswordResetToken(token);

      res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      next(error);
    }
  },

  // Đổi mật khẩu
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword) {
        throw new ValidationError('Mật khẩu hiện tại không được để trống');
      }

      AuthValidator.validatePasswordResetData({ password: newPassword, confirmPassword });

      const user = await userRepository.findById(req.user.userId);
      if (!user) {
        throw new AuthenticationError('Người dùng không tồn tại');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        throw new AuthenticationError('Mật khẩu hiện tại không đúng');
      }

      await userRepository.updatePassword(user.user_id, newPassword);

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  }
};

module.exports = authController; 