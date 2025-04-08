const validator = require('validator');
const { ValidationError } = require('../utils/errors');

class AuthValidator {
  static validateRegistrationData(data) {
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
      const phoneRegex = /^(02|03|07|08|09)[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        errors.push('Số điện thoại không hợp lệ. Số điện thoại phải bắt đầu bằng 02, 03, 07, 08, 09 và có 10 số');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('. '));
    }
  }

  static validateLoginData(data) {
    const errors = [];
    const { username, password } = data;

    if (!username) {
      errors.push('Username không được để trống');
    }

    if (!password) {
      errors.push('Mật khẩu không được để trống');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('. '));
    }
  }

  static validatePasswordResetData(data) {
    const errors = [];
    const { password, confirmPassword } = data;

    if (!password) {
      errors.push('Mật khẩu không được để trống');
    } else if (password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
    }

    if (password !== confirmPassword) {
      errors.push('Mật khẩu xác nhận không khớp');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('. '));
    }
  }
}

module.exports = AuthValidator; 