const pool = require('../config/database');

const createRecyclingProcessTables = async () => {
  try {
    console.log('Checking and creating recycling process tables if not exist...');
    
    // Check if recyclingprocesses table exists
    const [recyclingProcessesTable] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recyclingprocesses'
    `);
    
    if (recyclingProcessesTable.length === 0) {
      console.log('Creating recyclingprocesses table...');
      
      // Create recyclingprocesses table
      await pool.query(`
        CREATE TABLE recyclingprocesses (
          process_id INT NOT NULL AUTO_INCREMENT,
          transaction_id INT DEFAULT NULL,
          waste_type_id INT DEFAULT NULL,
          processed_quantity DECIMAL(10,2) DEFAULT NULL,
          start_date DATETIME DEFAULT NULL,
          end_date DATETIME DEFAULT NULL,
          status ENUM('pending','in_progress','completed') DEFAULT 'pending',
          PRIMARY KEY (process_id),
          KEY transaction_id (transaction_id),
          KEY waste_type_id (waste_type_id),
          CONSTRAINT recyclingprocesses_ibfk_1 FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON DELETE SET NULL,
          CONSTRAINT recyclingprocesses_ibfk_2 FOREIGN KEY (waste_type_id) REFERENCES wastetypes (waste_type_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      
      console.log('recyclingprocesses table created successfully');
    } else {
      console.log('recyclingprocesses table already exists');
    }
    
    console.log('Recycling process tables check completed');
    
  } catch (error) {
    console.error('Error creating recycling process tables:', error);
    throw error;
  }
};

module.exports = createRecyclingProcessTables; 