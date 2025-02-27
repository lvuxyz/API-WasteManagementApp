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
    
    const [users] = await pool.execute(
      'SELECT user_id, username, email, status FROM Users WHERE user_id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      throw new AuthenticationError('Token không hợp lệ');
    }

    const user = users[0];
    
    if (user.status === 'inactive') {
      throw new AuthenticationError('Tài khoản đã bị vô hiệu hóa');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth; 