const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const validator = require('validator');
const { 
  ValidationError, 
  AuthenticationError, 
  DuplicateError 
} = require('../utils/errors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

const authController = {
  // Đăng ký người dùng mới
  register: async (req, res, next) => {
    try {
      console.log('Request body:', req.body);

      if (!req.body) {
        throw new ValidationError('Dữ liệu đăng ký không được để trống');
      }

      let { full_name, username, email, password, phone, address } = req.body;
      
      console.log('Extracted data:', { full_name, username, email, password, phone, address });

      // Chuyển đổi và làm sạch dữ liệu
      full_name = full_name?.toString().trim();
      username = username?.toString().trim().toLowerCase(); // Chuyển username về lowercase
      email = email?.toString().trim().toLowerCase(); // Chuyển email về lowercase
      password = password?.toString();
      phone = phone?.toString().trim() || null; // Xử lý null cho phone
      address = address?.toString().trim() || null; // Xử lý null cho address

      console.log('After trim:', { full_name, username, email, password, phone, address });

      // Validate dữ liệu
      try {
        validateRegistrationData({ full_name, username, email, password, phone });
        console.log('Validation passed');
      } catch (validationError) {
        console.log('Validation failed:', validationError.message);
        throw validationError;
      }

      try {
        // Kiểm tra username và email riêng biệt để thông báo chính xác hơn
        const [existingUsername] = await pool.execute(
          'SELECT username FROM Users WHERE username = ?',
          [username]
        );

        if (existingUsername.length > 0) {
          throw new DuplicateError('Username đã tồn tại trong hệ thống');
        }

        const [existingEmail] = await pool.execute(
          'SELECT email FROM Users WHERE email = ?',
          [email]
        );

        if (existingEmail.length > 0) {
          throw new DuplicateError('Email đã tồn tại trong hệ thống');
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user mới với các trường đúng như trong database
        const [result] = await pool.execute(
          `INSERT INTO Users (
            full_name,
            username,
            email,
            password_hash,
            phone,
            address,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
          [
            full_name,
            username,
            email,
            hashedPassword,
            phone,
            address
          ]
        );
        console.log('Insert result:', result);

        // Sau khi insert user thành công, kiểm tra xem có user nào trong hệ thống chưa
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM Users');
        
        // Nếu đây là user đầu tiên, set làm admin
        if (userCount[0].count === 1) {
          await pool.execute(
            'INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)',
            [result.insertId, 1] // role_id = 1 là ADMIN
          );
        } else {
          // Kiểm tra xem có role USER trong database không (role_id = 2)
          const [userRoleCheck] = await pool.execute('SELECT role_id FROM Roles WHERE name = "USER"');
          
          if (userRoleCheck.length > 0) {
            // Nếu có role USER, gán cho người dùng mới
            await pool.execute(
              'INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)',
              [result.insertId, userRoleCheck[0].role_id]
            );
          } else {
            // Nếu chưa có role USER, tạo role mới và gán cho người dùng
            const [insertRoleResult] = await pool.execute(
              'INSERT INTO Roles (name) VALUES ("USER")'
            );
            
            await pool.execute(
              'INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)',
              [result.insertId, insertRoleResult.insertId]
            );
          }
        }

        // Lấy thông tin user và role
        const [newUser] = await pool.execute(`
          SELECT u.user_id, u.full_name, u.username, u.email, u.status, 
                 GROUP_CONCAT(r.name) as roles
          FROM Users u
          LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
          LEFT JOIN Roles r ON ur.role_id = r.role_id
          WHERE u.user_id = ?
          GROUP BY u.user_id`,
          [result.insertId]
        );

        // Tạo JWT token với thêm thông tin về role
        const token = jwt.sign(
          { 
            id: newUser[0].user_id,
            username: newUser[0].username,
            status: newUser[0].status,
            roles: newUser[0].roles ? newUser[0].roles.split(',') : []
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
              id: newUser[0].user_id,
              full_name: newUser[0].full_name,
              username: newUser[0].username,
              email: newUser[0].email,
              status: newUser[0].status,
              roles: newUser[0].roles ? newUser[0].roles.split(',') : []
            },
          }
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        if (dbError.code === 'ER_DUP_ENTRY') {
          throw new DuplicateError('Username hoặc email đã tồn tại');
        }
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
      const [users] = await pool.execute(`
        SELECT u.*, GROUP_CONCAT(r.name) as roles
        FROM Users u
        LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.username = ? OR u.email = ?
        GROUP BY u.user_id`,
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

      // Tạo JWT token với thêm thông tin về role
      const token = jwt.sign(
        { 
          id: user.user_id,
          username: user.username,
          status: user.status,
          roles: user.roles ? user.roles.split(',') : []
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
            status: user.status,
            roles: user.roles ? user.roles.split(',') : []
          },
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Thêm method mới vào authController
  getCurrentUser: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const [users] = await pool.execute(`
        SELECT u.user_id, u.full_name, u.username, u.email, u.status,
               GROUP_CONCAT(r.name) as roles
        FROM Users u
        LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.user_id = ?
        GROUP BY u.user_id`,
        [userId]
      );

      if (users.length === 0) {
        throw new AuthenticationError('User không tồn tại');
      }

      const user = users[0];

      res.json({
        status: 'success',
        data: {
          user: {
            id: user.user_id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            status: user.status,
            roles: user.roles ? user.roles.split(',') : []
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Thêm method logout
  logout: async (req, res, next) => {
    try {
      // Trong thực tế, bạn có thể muốn thêm token vào blacklist hoặc 
      // lưu trữ trong database để track các token đã đăng xuất
      // Nhưng ở đây chúng ta sẽ xử lý đơn giản bằng cách trả về thông báo thành công
      
      res.json({
        status: 'success',
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      next(error);
    }
  },

  // Gửi yêu cầu reset password
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Vui lòng cung cấp email');
      }

      // Kiểm tra email có tồn tại không
      const [users] = await pool.execute(
        'SELECT user_id, full_name, email FROM Users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw new ValidationError('Email không tồn tại trong hệ thống');
      }

      const user = users[0];

      // Tạo token reset password
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Xóa các token cũ của user này (nếu có)
      await pool.execute(
        'DELETE FROM PasswordResets WHERE user_id = ?',
        [user.user_id]
      );

      // Lưu token mới vào database (hết hạn sau 15 phút)
      await pool.execute(
        `INSERT INTO PasswordResets (user_id, reset_token, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
        [user.user_id, hashedToken]
      );

      // Tạo URL reset password
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      // Gửi email
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: 'Yêu cầu đặt lại mật khẩu',
        html: `
          <h1>Xin chào ${user.full_name},</h1>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
          <a href="${resetURL}">${resetURL}</a>
          <p>Link này sẽ hết hạn sau 15 phút.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        `
      });

      res.json({
        status: 'success',
        message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn'
      });
    } catch (error) {
      next(error);
    }
  },

  // Reset password với token
  resetPassword: async (req, res, next) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        throw new ValidationError('Vui lòng cung cấp đầy đủ thông tin');
      }

      // Validate password
      if (password.length < 6) {
        throw new ValidationError('Mật khẩu phải có ít nhất 6 ký tự');
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password)) {
        throw new ValidationError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
      }

      // Hash token từ params
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Tìm token trong database
      const [resetRecords] = await pool.execute(
        `SELECT pr.user_id, u.email 
         FROM PasswordResets pr
         JOIN Users u ON pr.user_id = u.user_id
         WHERE pr.reset_token = ? AND pr.expires_at > NOW()`,
        [hashedToken]
      );

      if (resetRecords.length === 0) {
        throw new ValidationError('Token không hợp lệ hoặc đã hết hạn');
      }

      const resetRecord = resetRecords[0];

      // Hash password mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Cập nhật password
      await pool.execute(
        'UPDATE Users SET password_hash = ? WHERE user_id = ?',
        [hashedPassword, resetRecord.user_id]
      );

      // Xóa token đã sử dụng
      await pool.execute(
        'DELETE FROM PasswordResets WHERE user_id = ?',
        [resetRecord.user_id]
      );

      res.json({
        status: 'success',
        message: 'Mật khẩu đã được đặt lại thành công'
      });
    } catch (error) {
      next(error);
    }
  },

  // Đổi mật khẩu
  changePassword: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new ValidationError('Vui lòng cung cấp đầy đủ thông tin: mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới');
      }

      // Kiểm tra mật khẩu mới và xác nhận mật khẩu
      if (newPassword !== confirmPassword) {
        throw new ValidationError('Mật khẩu mới và xác nhận mật khẩu mới không khớp');
      }

      // Kiểm tra mật khẩu mới không được trùng với mật khẩu hiện tại
      if (currentPassword === newPassword) {
        throw new ValidationError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      }

      // Validate mật khẩu mới
      if (newPassword.length < 6) {
        throw new ValidationError('Mật khẩu mới phải có ít nhất 6 ký tự');
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(newPassword)) {
        throw new ValidationError(
          'Mật khẩu mới phải đáp ứng các yêu cầu sau:\n' +
          '- Ít nhất 6 ký tự\n' +
          '- Ít nhất 1 chữ hoa\n' +
          '- Ít nhất 1 chữ thường\n' +
          '- Ít nhất 1 số\n' +
          '- Ít nhất 1 ký tự đặc biệt (@$!%*?&)'
        );
      }

      // Kiểm tra mật khẩu hiện tại
      const [users] = await pool.execute(
        'SELECT password_hash FROM Users WHERE user_id = ?',
        [userId]
      );

      if (users.length === 0) {
        throw new AuthenticationError('Người dùng không tồn tại');
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidPassword) {
        throw new ValidationError('Mật khẩu hiện tại không chính xác');
      }

      // Kiểm tra mật khẩu mới có trùng với các mật khẩu đã sử dụng gần đây không
      const hashedNewPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
      const isCurrentPassword = await bcrypt.compare(newPassword, user.password_hash);

      if (isCurrentPassword) {
        throw new ValidationError('Mật khẩu mới không được trùng với mật khẩu đã sử dụng gần đây');
      }

      // Cập nhật mật khẩu
      await pool.execute(
        'UPDATE Users SET password_hash = ? WHERE user_id = ?',
        [hashedNewPassword, userId]
      );

      res.json({
        status: 'success',
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController; 