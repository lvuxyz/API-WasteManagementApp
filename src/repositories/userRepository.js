const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { DuplicateError } = require('../utils/errors');
const logger = require('../utils/logger');

class UserRepository {
  async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM Users WHERE username = ?',
        [username]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error in findByUsername:', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM Users WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error in findByEmail:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM Users WHERE user_id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error in findById:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const { full_name, username, email, password, phone, address } = userData;
      
      // Kiểm tra username và email đã tồn tại
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

      // Insert user mới
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
        [full_name, username, email, hashedPassword, phone, address]
      );

      return result.insertId;
    } catch (error) {
      logger.error('Error in createUser:', error);
      throw error;
    }
  }

  async assignRole(userId, roleId) {
    try {
      await pool.execute(
        'INSERT INTO UserRoles (user_id, role_id) VALUES (?, ?)',
        [userId, roleId]
      );
    } catch (error) {
      logger.error('Error in assignRole:', error);
      throw error;
    }
  }

  async getUserWithRoles(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.user_id, u.full_name, u.username, u.email, u.status, 
               GROUP_CONCAT(r.name) as roles
        FROM Users u
        LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.user_id = ?
        GROUP BY u.user_id`,
        [userId]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error in getUserWithRoles:', error);
      throw error;
    }
  }

  async updatePassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await pool.execute(
        'UPDATE Users SET password_hash = ? WHERE user_id = ?',
        [hashedPassword, userId]
      );
    } catch (error) {
      logger.error('Error in updatePassword:', error);
      throw error;
    }
  }

  async createPasswordResetToken(userId) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      await pool.execute(
        'INSERT INTO PasswordResetTokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );

      return token;
    } catch (error) {
      logger.error('Error in createPasswordResetToken:', error);
      throw error;
    }
  }

  async validatePasswordResetToken(token) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM PasswordResetTokens WHERE token = ? AND expires_at > NOW()',
        [token]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error in validatePasswordResetToken:', error);
      throw error;
    }
  }

  async deletePasswordResetToken(token) {
    try {
      await pool.execute(
        'DELETE FROM PasswordResetTokens WHERE token = ?',
        [token]
      );
    } catch (error) {
      logger.error('Error in deletePasswordResetToken:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository(); 