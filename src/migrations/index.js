const createTransactionTables = require('./transactionTables');

const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    
    // Run transaction tables migrations
    await createTransactionTables();
    
    console.log('All migrations have been completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
};

module.exports = runMigrations; 