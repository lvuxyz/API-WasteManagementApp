const createTransactionTables = require('./transactionTables');
const createRecyclingProcessTables = require('./recyclingProcessTables');
const createRewardTables = require('./rewardTables');
const logger = require('../utils/logger');

const runMigrations = async () => {
  try {
    logger.info('Running database migrations...');
    
    // Run transaction tables migrations
    await createTransactionTables();
    
    // Run recycling process tables migrations
    await createRecyclingProcessTables();
    
    // Run reward tables migrations
    await createRewardTables();
    
    logger.info('All migrations have been completed successfully');
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  }
};

module.exports = runMigrations; 