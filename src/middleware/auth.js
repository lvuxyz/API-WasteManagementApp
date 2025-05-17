const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { AuthenticationError } = require('../utils/errors');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AuthenticationError('Không tìm thấy token xác thực');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.execute(`
      SELECT u.user_id, u.username, u.email, u.status,
             GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN userroles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = ?
      GROUP BY u.user_id`,
      [decoded.id]
    );

    if (users.length === 0) {
      throw new AuthenticationError('Token không hợp lệ');
    }

    const user = users[0];
    
    if (user.status === 'inactive') {
      throw new AuthenticationError('Tài khoản đã bị vô hiệu hóa');
    }

    req.user = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      status: user.status,
      roles: user.roles ? user.roles.split(',') : []
    };
    
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Token không hợp lệ'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token đã hết hạn'));
    } else {
      next(error);
    }
  }
};

module.exports = auth; 