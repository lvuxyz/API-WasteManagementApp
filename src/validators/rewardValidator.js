const { ValidationError } = require('../utils/errors');

class RewardValidator {
  /**
   * Validate reward creation request (admin only)
   */
  static validateCreateReward(data) {
    if (!data) {
      throw new ValidationError('Yêu cầu dữ liệu để tạo điểm thưởng');
    }
    
    // Kiểm tra user_id
    if (!data.user_id) {
      throw new ValidationError('ID người dùng là bắt buộc');
    }
    
    // Kiểm tra points
    if (!data.points) {
      throw new ValidationError('Số điểm thưởng là bắt buộc');
    }
    
    if (isNaN(data.points) || data.points < 0) {
      throw new ValidationError('Số điểm thưởng phải là số dương');
    }
    
    return true;
  }
  
  /**
   * Validate reward update request (admin only)
   */
  static validateUpdateReward(data) {
    if (!data) {
      throw new ValidationError('Yêu cầu dữ liệu để cập nhật điểm thưởng');
    }
    
    // Kiểm tra points
    if (!data.points && data.points !== 0) {
      throw new ValidationError('Số điểm thưởng là bắt buộc');
    }
    
    if (isNaN(data.points) || data.points < 0) {
      throw new ValidationError('Số điểm thưởng phải là số dương');
    }
    
    return true;
  }
}

module.exports = RewardValidator; 