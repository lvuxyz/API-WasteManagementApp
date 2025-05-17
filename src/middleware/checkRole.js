const pool = require('../config/database');
const { AuthorizationError } = require('../utils/errors');

const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; // Lấy từ middleware auth

      // Kiểm tra role của user
      const [userRoles] = await pool.execute(`
        SELECT r.name 
        FROM roles r 
        JOIN userroles ur ON r.role_id = ur.role_id 
        WHERE ur.user_id = ?`,
        [userId]
      );

      const hasRole = userRoles.some(role => role.name === requiredRole);

      if (!hasRole) {
        throw new AuthorizationError('Bạn không có quyền thực hiện hành động này');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = checkRole; 