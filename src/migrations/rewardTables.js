const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create or update rewards-related tables
 */
const createRewardTables = async () => {
  const connection = await pool.getConnection();
  
  try {
    logger.info('Running reward tables migrations...');
    
    // Start transaction
    await connection.beginTransaction();
    
    // Check if rewards table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'rewards'
    `);
    
    // Create rewards table if it doesn't exist
    if (tables.length === 0) {
      logger.info('Creating rewards table...');
      
      await connection.query(`
        CREATE TABLE rewards (
          reward_id INT NOT NULL AUTO_INCREMENT,
          user_id INT DEFAULT NULL,
          transaction_id INT DEFAULT NULL,
          points INT DEFAULT 0,
          earned_date DATETIME DEFAULT (NOW()),
          PRIMARY KEY (reward_id),
          KEY user_id (user_id),
          KEY transaction_id (transaction_id),
          CONSTRAINT rewards_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL,
          CONSTRAINT rewards_ibfk_2 FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
    } else {
      // Check if any columns need to be added/modified in the existing table
      const [columns] = await connection.query(`
        SHOW COLUMNS FROM rewards
      `);
      
      const columnNames = columns.map(col => col.Field);
      
      // Make sure all required columns exist
      if (!columnNames.includes('user_id')) {
        await connection.query(`
          ALTER TABLE rewards 
          ADD COLUMN user_id INT DEFAULT NULL,
          ADD KEY user_id (user_id),
          ADD CONSTRAINT rewards_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
        `);
      }
      
      if (!columnNames.includes('transaction_id')) {
        await connection.query(`
          ALTER TABLE rewards 
          ADD COLUMN transaction_id INT DEFAULT NULL,
          ADD KEY transaction_id (transaction_id),
          ADD CONSTRAINT rewards_ibfk_2 FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON DELETE SET NULL
        `);
      }
      
      if (!columnNames.includes('points')) {
        await connection.query(`
          ALTER TABLE rewards 
          ADD COLUMN points INT DEFAULT 0
        `);
      }
      
      if (!columnNames.includes('earned_date')) {
        await connection.query(`
          ALTER TABLE rewards 
          ADD COLUMN earned_date DATETIME DEFAULT (NOW())
        `);
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    logger.info('Reward tables migration completed successfully');
  } catch (error) {
    // Rollback transaction if error occurs
    await connection.rollback();
    logger.error('Error in reward tables migration:', error);
    throw error;
  } finally {
    // Release connection
    connection.release();
  }
};

module.exports = createRewardTables; 