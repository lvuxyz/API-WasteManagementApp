const pool = require('../config/database');

const createTransactionTables = async () => {
  try {
    console.log('Checking and creating transaction tables if not exist...');
    
    // Check if Transactions table exists
    const [transactionsTable] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Transactions'
    `);
    
    if (transactionsTable.length === 0) {
      console.log('Creating Transactions table...');
      
      // Create Transactions table
      await pool.query(`
        CREATE TABLE Transactions (
          transaction_id INT NOT NULL AUTO_INCREMENT,
          user_id INT DEFAULT NULL,
          collection_point_id INT DEFAULT NULL,
          waste_type_id INT DEFAULT NULL,
          quantity DECIMAL(10,2) NOT NULL,
          unit VARCHAR(20) DEFAULT 'kg',
          transaction_date DATETIME DEFAULT (NOW()),
          status ENUM('pending','verified','completed','rejected') DEFAULT 'pending',
          proof_image_url VARCHAR(255) DEFAULT NULL,
          PRIMARY KEY (transaction_id),
          KEY idx_transactions_status (status),
          KEY user_id (user_id),
          KEY collection_point_id (collection_point_id),
          KEY waste_type_id (waste_type_id),
          CONSTRAINT transactions_ibfk_1 FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE SET NULL,
          CONSTRAINT transactions_ibfk_2 FOREIGN KEY (collection_point_id) REFERENCES CollectionPoints (collection_point_id) ON DELETE SET NULL,
          CONSTRAINT transactions_ibfk_3 FOREIGN KEY (waste_type_id) REFERENCES WasteTypes (waste_type_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      
      console.log('Transactions table created successfully');
    } else {
      console.log('Transactions table already exists');
    }
    
    // Check if TransactionHistory table exists
    const [transactionHistoryTable] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'TransactionHistory'
    `);
    
    if (transactionHistoryTable.length === 0) {
      console.log('Creating TransactionHistory table...');
      
      // Create TransactionHistory table
      await pool.query(`
        CREATE TABLE TransactionHistory (
          history_id INT NOT NULL AUTO_INCREMENT,
          transaction_id INT DEFAULT NULL,
          status ENUM('pending','verified','completed','rejected') NOT NULL,
          changed_at DATETIME DEFAULT (NOW()),
          PRIMARY KEY (history_id),
          KEY transaction_id (transaction_id),
          CONSTRAINT transactionhistory_ibfk_1 FOREIGN KEY (transaction_id) REFERENCES Transactions (transaction_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      
      console.log('TransactionHistory table created successfully');
    } else {
      console.log('TransactionHistory table already exists');
    }
    
    // Check if Images table exists
    const [imagesTable] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Images'
    `);
    
    if (imagesTable.length === 0) {
      console.log('Creating Images table...');
      
      // Create Images table
      await pool.query(`
        CREATE TABLE Images (
          image_id INT NOT NULL AUTO_INCREMENT,
          user_id INT DEFAULT NULL,
          transaction_id INT DEFAULT NULL,
          image_name VARCHAR(255) NOT NULL,
          image_url VARCHAR(255) NOT NULL,
          image_type VARCHAR(50) DEFAULT NULL,
          image_category ENUM('avatar','waste','upload') NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (image_id),
          KEY user_id (user_id),
          KEY transaction_id (transaction_id),
          CONSTRAINT images_ibfk_1 FOREIGN KEY (user_id) REFERENCES Users (user_id) ON DELETE SET NULL,
          CONSTRAINT images_ibfk_2 FOREIGN KEY (transaction_id) REFERENCES Transactions (transaction_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      
      console.log('Images table created successfully');
    } else {
      console.log('Images table already exists');
    }
    
    console.log('Transaction-related tables check completed');
    
  } catch (error) {
    console.error('Error creating transaction tables:', error);
    throw error;
  }
};

module.exports = createTransactionTables; 