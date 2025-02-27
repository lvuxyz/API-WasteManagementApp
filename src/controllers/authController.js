const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const validator = require('validator');
const { 
  ValidationError, 
  AuthenticationError, 
  DuplicateError 
} = require('../utils/errors');

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
  if (phone && !validator.isMobilePhone(phone, 'vi-VN')) {
    errors.push('Số điện thoại không hợp lệ');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('. '));
  }
};

const authController = {
  // Đăng ký người dùng mới
  register: async (req, res, next) => {
    try {
      // Kiểm tra req.body có tồn tại không
      if (!req.body) {
        throw new ValidationError('Dữ liệu đăng ký không được để trống');
      }

      let { full_name, username, email, password, phone, address } = req.body;

      // Chuyển đổi các giá trị thành string nếu tồn tại
      full_name = full_name?.toString().trim();
      username = username?.toString().trim();
      email = email?.toString().trim();
      password = password?.toString();
      phone = phone?.toString().trim();
      address = address?.toString().trim();

      // Validate tất cả dữ liệu đầu vào
      validateRegistrationData({ full_name, username, email, password, phone });

      try {
        // Kiểm tra username và email đã tồn tại chưa
        const [existingUser] = await pool.execute(
          'SELECT username, email FROM Users WHERE username = ? OR email = ?',
          [username, email]
        );

        if (existingUser.length > 0) {
          const field = existingUser[0].username === username ? 'Username' : 'Email';
          throw new DuplicateError(`${field} đã tồn tại trong hệ thống`);
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Thêm user mới vào database
        const [result] = await pool.execute(
          `INSERT INTO Users (
            full_name,
            username,
            email,
            password_hash,
            phone,
            address
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            full_name,
            username,
            email,
            hashedPassword,
            phone || null,
            address || null
          ]
        );

        // Tạo JWT token
        const token = jwt.sign(
          { 
            id: result.insertId,
            username: username
          }, 
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          status: 'success',
          message: 'Đăng ký thành công',
          data: {
            token,
            user: {
              id: result.insertId,
              full_name,
              username,
              email,
            },
          }
        });
      } catch (dbError) {
        // Xử lý lỗi database
        console.error('Database error:', dbError);
        throw new Error('Lỗi khi thao tác với database');
      }
    } catch (error) {
      next(error);
    }
  },

  // Đăng nhập
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username) {
        throw new ValidationError('Vui lòng nhập username hoặc email');
      }

      if (!password) {
        throw new ValidationError('Vui lòng nhập mật khẩu');
      }

      // Kiểm tra user có tồn tại không
      const [users] = await pool.execute(
        'SELECT * FROM Users WHERE username = ? OR email = ?',
        [username, username]
      );

      if (users.length === 0) {
        throw new AuthenticationError('Tài khoản không tồn tại');
      }

      const user = users[0];

      // Kiểm tra mật khẩu
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new AuthenticationError('Mật khẩu không chính xác');
      }

      // Kiểm tra trạng thái tài khoản
      if (user.status === 'inactive') {
        throw new AuthenticationError('Tài khoản đã bị vô hiệu hóa');
      }

      // Tạo JWT token
      const token = jwt.sign(
        { 
          id: user.user_id,
          username: user.username
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        status: 'success',
        message: 'Đăng nhập thành công',
        data: {
          token,
          user: {
            id: user.user_id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
          },
        }
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController; 