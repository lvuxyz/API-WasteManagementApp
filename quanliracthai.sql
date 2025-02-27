CREATE TABLE `Users` (
  `user_id` INT PRIMARY KEY AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(15),
  `address` VARCHAR(255),
  `status` ENUM ('active', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Roles` (
  `role_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE `UserRoles` (
  `user_id` INT,
  `role_id` INT,
  PRIMARY KEY (`user_id`, `role_id`)
);

CREATE TABLE `WasteTypes` (
  `waste_type_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT,
  `recyclable` BOOLEAN DEFAULT false,
  `handling_instructions` TEXT,
  `unit_price` DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE `CollectionPoints` (
  `collection_point_id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `operating_hours` VARCHAR(100),
  `capacity` DECIMAL(10,2),
  `current_load` DECIMAL(10,2) DEFAULT 0,
  `status` ENUM ('active', 'inactive', 'full') DEFAULT 'active'
);

CREATE TABLE `CollectionPointStatusHistory` (
  `status_id` INT PRIMARY KEY AUTO_INCREMENT,
  `collection_point_id` INT,
  `status` ENUM ('active', 'inactive', 'full') NOT NULL,
  `updated_at` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `CollectionPointWasteTypes` (
  `collection_point_id` INT,
  `waste_type_id` INT,
  PRIMARY KEY (`collection_point_id`, `waste_type_id`)
);

CREATE TABLE `Transactions` (
  `transaction_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `collection_point_id` INT,
  `waste_type_id` INT,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit` VARCHAR(20) DEFAULT 'kg',
  `transaction_date` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `status` ENUM ('pending', 'verified', 'completed', 'rejected') DEFAULT 'pending',
  `proof_image_url` VARCHAR(255)
);

CREATE TABLE `TransactionHistory` (
  `history_id` INT PRIMARY KEY AUTO_INCREMENT,
  `transaction_id` INT,
  `status` ENUM ('pending', 'verified', 'completed', 'rejected') NOT NULL,
  `changed_at` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `RecyclingProcesses` (
  `process_id` INT PRIMARY KEY AUTO_INCREMENT,
  `transaction_id` INT,
  `waste_type_id` INT,
  `processed_quantity` DECIMAL(10,2),
  `start_date` DATETIME,
  `end_date` DATETIME,
  `status` ENUM ('pending', 'in_progress', 'completed') DEFAULT 'pending'
);

CREATE TABLE `Rewards` (
  `reward_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `transaction_id` INT,
  `points` INT DEFAULT 0,
  `earned_date` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Reports` (
  `report_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `report_type` ENUM ('daily', 'weekly', 'monthly', 'yearly', 'custom'),
  `start_date` DATE,
  `end_date` DATE,
  `total_waste` DECIMAL(10,2),
  `total_recycled` DECIMAL(10,2),
  `generated_at` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `ReportDetails` (
  `report_id` INT,
  `waste_type_id` INT,
  `total_quantity` DECIMAL(10,2),
  PRIMARY KEY (`report_id`, `waste_type_id`)
);

CREATE INDEX `idx_users_username` ON `Users` (`username`);

CREATE INDEX `idx_users_email` ON `Users` (`email`);

CREATE INDEX `idx_transactions_status` ON `Transactions` (`status`);

ALTER TABLE `UserRoles` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `UserRoles` ADD FOREIGN KEY (`role_id`) REFERENCES `Roles` (`role_id`) ON DELETE CASCADE;

ALTER TABLE `CollectionPointStatusHistory` ADD FOREIGN KEY (`collection_point_id`) REFERENCES `CollectionPoints` (`collection_point_id`) ON DELETE CASCADE;

ALTER TABLE `CollectionPointWasteTypes` ADD FOREIGN KEY (`collection_point_id`) REFERENCES `CollectionPoints` (`collection_point_id`) ON DELETE CASCADE;

ALTER TABLE `CollectionPointWasteTypes` ADD FOREIGN KEY (`waste_type_id`) REFERENCES `WasteTypes` (`waste_type_id`) ON DELETE CASCADE;

ALTER TABLE `Transactions` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL;

ALTER TABLE `Transactions` ADD FOREIGN KEY (`collection_point_id`) REFERENCES `CollectionPoints` (`collection_point_id`) ON DELETE SET NULL;

ALTER TABLE `Transactions` ADD FOREIGN KEY (`waste_type_id`) REFERENCES `WasteTypes` (`waste_type_id`) ON DELETE SET NULL;

ALTER TABLE `TransactionHistory` ADD FOREIGN KEY (`transaction_id`) REFERENCES `Transactions` (`transaction_id`) ON DELETE CASCADE;

ALTER TABLE `RecyclingProcesses` ADD FOREIGN KEY (`transaction_id`) REFERENCES `Transactions` (`transaction_id`) ON DELETE SET NULL;

ALTER TABLE `RecyclingProcesses` ADD FOREIGN KEY (`waste_type_id`) REFERENCES `WasteTypes` (`waste_type_id`) ON DELETE SET NULL;

ALTER TABLE `Rewards` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL;

ALTER TABLE `Rewards` ADD FOREIGN KEY (`transaction_id`) REFERENCES `Transactions` (`transaction_id`) ON DELETE SET NULL;

ALTER TABLE `Reports` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE SET NULL;

ALTER TABLE `ReportDetails` ADD FOREIGN KEY (`report_id`) REFERENCES `Reports` (`report_id`) ON DELETE CASCADE;

ALTER TABLE `ReportDetails` ADD FOREIGN KEY (`waste_type_id`) REFERENCES `WasteTypes` (`waste_type_id`) ON DELETE CASCADE;

-- Thêm role ADMIN vào bảng Roles
INSERT INTO Roles (role_id, name) VALUES (1, 'ADMIN');

-- Giả sử user_id = 1 là admin, thêm vào bảng UserRoles
INSERT INTO UserRoles (user_id, role_id) VALUES (1, 1);
