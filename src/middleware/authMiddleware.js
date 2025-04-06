const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');

/**
 * Authentication middleware
 */
exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AuthenticationError('Không tìm thấy token xác thực');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.execute(`
      SELECT u.user_id, u.username, u.email, u.status,
             GROUP_CONCAT(r.name) as roles
      FROM Users u
      LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
      LEFT JOIN Roles r ON ur.role_id = r.role_id
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

/**
 * Role-based authorization middleware
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Make sure req.user exists (requires isAuthenticated middleware to run first)
    if (!req.user) {
      return next(new AuthenticationError('Bạn chưa đăng nhập'));
    }

    // Check if user has any of the required roles
    const hasRole = req.user.roles.some(role => roles.includes(role));

    if (!hasRole) {
      return next(new AuthorizationError('Bạn không có quyền thực hiện hành động này'));
    }

    next();
  };
}; 