const { ValidationError } = require('../utils/errors');

class TransactionValidator {
  static validateCreateTransaction(data) {
    const errors = [];
    const { collection_point_id, waste_type_id, quantity } = data;

    // Validate collection_point_id
    if (!collection_point_id) {
      errors.push('Điểm thu gom không được để trống');
    } else if (!Number.isInteger(Number(collection_point_id)) || Number(collection_point_id) <= 0) {
      errors.push('ID điểm thu gom không hợp lệ');
    }

    // Validate waste_type_id
    if (!waste_type_id) {
      errors.push('Loại rác thải không được để trống');
    } else if (!Number.isInteger(Number(waste_type_id)) || Number(waste_type_id) <= 0) {
      errors.push('ID loại rác thải không hợp lệ');
    }

    // Validate quantity
    if (!quantity) {
      errors.push('Số lượng không được để trống');
    } else if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      errors.push('Số lượng phải là số dương');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('. '));
    }
  }

  static validateUpdateTransaction(data) {
    const errors = [];
    const { collection_point_id, waste_type_id, quantity, status } = data;

    // Validate collection_point_id if provided
    if (collection_point_id !== undefined) {
      if (!Number.isInteger(Number(collection_point_id)) || Number(collection_point_id) <= 0) {
        errors.push('ID điểm thu gom không hợp lệ');
      }
    }

    // Validate waste_type_id if provided
    if (waste_type_id !== undefined) {
      if (!Number.isInteger(Number(waste_type_id)) || Number(waste_type_id) <= 0) {
        errors.push('ID loại rác thải không hợp lệ');
      }
    }

    // Validate quantity if provided
    if (quantity !== undefined) {
      if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
        errors.push('Số lượng phải là số dương');
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['pending', 'verified', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        errors.push(`Trạng thái không hợp lệ. Trạng thái phải là một trong: ${validStatuses.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('. '));
    }
  }

  static validateStatusUpdate(data) {
    const errors = [];
    const { status } = data;

    // Validate status
    if (!status) {
      errors.push('Trạng thái không được để trống');
    } else {
      const validStatuses = ['pending', 'verified', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        errors.push(`Trạng thái không hợp lệ. Trạng thái phải là một trong: ${validStatuses.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('. '));
    }
  }
}

module.exports = TransactionValidator; 