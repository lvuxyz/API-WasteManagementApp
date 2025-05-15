const logger = require('../utils/logger');

const runMigrations = async () => {
  try {
    logger.info('Bỏ qua migrations vì database đã tồn tại...');
    logger.info('Migrations skipped successfully');
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
};

module.exports = runMigrations; 