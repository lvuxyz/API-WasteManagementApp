const { ValidationError } = require('../utils/errors');

/**
 * Middleware để xác thực dữ liệu đầu vào dựa trên schema
 * @param {Object} schema - Joi schema hoặc hàm xác thực tùy chỉnh
 * @returns {Function} Express middleware
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Nếu schema là hàm, thực thi với request body
      if (typeof schema === 'function') {
        schema(req.body);
        next();
        return;
      }
      
      // Nếu sử dụng Joi schema
      if (schema.validate) {
        const { error } = schema.validate(req.body, { 
          abortEarly: false, 
          allowUnknown: true,
          stripUnknown: true 
        });
        
        if (error) {
          const errorMessage = error.details.map(detail => detail.message).join(', ');
          throw new ValidationError(errorMessage);
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validateRequest; 