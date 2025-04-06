-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:3306
-- Thời gian đã tạo: Th4 06, 2025 lúc 03:56 PM
-- Phiên bản máy phục vụ: 8.0.30
-- Phiên bản PHP: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `quanliracthai`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `collectionpoints`
--

CREATE TABLE `collectionpoints` (
  `collection_point_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `operating_hours` varchar(100) DEFAULT NULL,
  `capacity` decimal(10,2) DEFAULT NULL,
  `current_load` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive','full') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `collectionpoints`
--

INSERT INTO `collectionpoints` (`collection_point_id`, `name`, `address`, `latitude`, `longitude`, `operating_hours`, `capacity`, `current_load`, `status`) VALUES
(1, 'Điểm Thu Gom Số 1', '123 Đường ABC, Quận 1, TP HCM', 10.77360000, 106.70340000, '08:00 - 17:00', 1000.00, 0.00, 'active'),
(2, 'Điểm Thu Gom Số 1', '123 Đường ABC, Quận 1, TP HCM', 10.77360000, 106.70340000, '08:00 - 17:00', 1000.00, 0.00, 'active');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `collectionpointstatushistory`
--

CREATE TABLE `collectionpointstatushistory` (
  `status_id` int NOT NULL,
  `collection_point_id` int DEFAULT NULL,
  `status` enum('active','inactive','full') NOT NULL,
  `updated_at` datetime DEFAULT (now()),
  `updated_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `collectionpointstatushistory`
--

INSERT INTO `collectionpointstatushistory` (`status_id`, `collection_point_id`, `status`, `updated_at`, `updated_by`) VALUES
(1, 1, 'active', '2025-04-06 22:49:09', NULL),
(2, 1, 'full', '2025-04-06 22:50:06', NULL),
(3, 1, 'active', '2025-04-06 22:50:36', NULL),
(4, 2, 'active', '2025-04-06 22:52:32', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `collectionpointwastetypes`
--

CREATE TABLE `collectionpointwastetypes` (
  `collection_point_id` int NOT NULL,
  `waste_type_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `images`
--

CREATE TABLE `images` (
  `image_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `transaction_id` int DEFAULT NULL,
  `image_name` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `image_type` varchar(50) DEFAULT NULL,
  `image_category` enum('avatar','waste','upload') NOT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `passwordresets`
--

CREATE TABLE `passwordresets` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `reset_token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `recyclingprocesses`
--

CREATE TABLE `recyclingprocesses` (
  `process_id` int NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `waste_type_id` int DEFAULT NULL,
  `processed_quantity` decimal(10,2) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` enum('pending','in_progress','completed') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reportdetails`
--

CREATE TABLE `reportdetails` (
  `report_id` int NOT NULL,
  `waste_type_id` int NOT NULL,
  `total_quantity` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reports`
--

CREATE TABLE `reports` (
  `report_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `report_type` enum('daily','weekly','monthly','yearly','custom') DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `total_waste` decimal(10,2) DEFAULT NULL,
  `total_recycled` decimal(10,2) DEFAULT NULL,
  `generated_at` datetime DEFAULT (now())
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `rewards`
--

CREATE TABLE `rewards` (
  `reward_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `transaction_id` int DEFAULT NULL,
  `points` int DEFAULT '0',
  `earned_date` datetime DEFAULT (now())
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `role_id` int NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`role_id`, `name`) VALUES
(1, 'ADMIN'),
(2, 'USER');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `transactionhistory`
--

CREATE TABLE `transactionhistory` (
  `history_id` int NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `status` enum('pending','verified','completed','rejected') NOT NULL,
  `changed_at` datetime DEFAULT (now())
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `transactions`
--

CREATE TABLE `transactions` (
  `transaction_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `collection_point_id` int DEFAULT NULL,
  `waste_type_id` int DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(20) DEFAULT 'kg',
  `transaction_date` datetime DEFAULT (now()),
  `status` enum('pending','verified','completed','rejected') DEFAULT 'pending',
  `proof_image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `userroles`
--

CREATE TABLE `userroles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `userroles`
--

INSERT INTO `userroles` (`user_id`, `role_id`) VALUES
(1, 1),
(4, 2);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT (now())
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `username`, `email`, `password_hash`, `phone`, `address`, `status`, `created_at`) VALUES
(1, 'Admin User', 'admin', 'lvu.byte@gmail.com', '$2a$10$b0BVVqKE4PNCGFRohM/J4.NeZfDMnkqE8CP2HPO2oH4orxDmbOxsC', '0332265689', 'Hà Nội', 'active', '2025-04-06 21:20:59'),
(4, 'Van Hai', 'lvuxyz0', 'vanhai@gmail.com', '$2a$10$kr/FXn/wY0akFDWr2RcuBOz4h70G5AsUUQb/k.Wthul47AZcq.UTe', '0999987567', 'Hà Nội', 'active', '2025-04-06 21:34:02');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `wastetypes`
--

CREATE TABLE `wastetypes` (
  `waste_type_id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text,
  `recyclable` tinyint(1) DEFAULT '0',
  `handling_instructions` text,
  `unit_price` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `collectionpoints`
--
ALTER TABLE `collectionpoints`
  ADD PRIMARY KEY (`collection_point_id`);

--
-- Chỉ mục cho bảng `collectionpointstatushistory`
--
ALTER TABLE `collectionpointstatushistory`
  ADD PRIMARY KEY (`status_id`),
  ADD KEY `collection_point_id` (`collection_point_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Chỉ mục cho bảng `collectionpointwastetypes`
--
ALTER TABLE `collectionpointwastetypes`
  ADD PRIMARY KEY (`collection_point_id`,`waste_type_id`),
  ADD KEY `waste_type_id` (`waste_type_id`);

--
-- Chỉ mục cho bảng `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Chỉ mục cho bảng `passwordresets`
--
ALTER TABLE `passwordresets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_reset_token` (`reset_token`);

--
-- Chỉ mục cho bảng `recyclingprocesses`
--
ALTER TABLE `recyclingprocesses`
  ADD PRIMARY KEY (`process_id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `waste_type_id` (`waste_type_id`);

--
-- Chỉ mục cho bảng `reportdetails`
--
ALTER TABLE `reportdetails`
  ADD PRIMARY KEY (`report_id`,`waste_type_id`),
  ADD KEY `waste_type_id` (`waste_type_id`);

--
-- Chỉ mục cho bảng `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`reward_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `transactionhistory`
--
ALTER TABLE `transactionhistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Chỉ mục cho bảng `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `idx_transactions_status` (`status`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `collection_point_id` (`collection_point_id`),
  ADD KEY `waste_type_id` (`waste_type_id`);

--
-- Chỉ mục cho bảng `userroles`
--
ALTER TABLE `userroles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_email` (`email`);

--
-- Chỉ mục cho bảng `wastetypes`
--
ALTER TABLE `wastetypes`
  ADD PRIMARY KEY (`waste_type_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `collectionpoints`
--
ALTER TABLE `collectionpoints`
  MODIFY `collection_point_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `collectionpointstatushistory`
--
ALTER TABLE `collectionpointstatushistory`
  MODIFY `status_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `images`
--
ALTER TABLE `images`
  MODIFY `image_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `passwordresets`
--
ALTER TABLE `passwordresets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `recyclingprocesses`
--
ALTER TABLE `recyclingprocesses`
  MODIFY `process_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `rewards`
--
ALTER TABLE `rewards`
  MODIFY `reward_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `transactionhistory`
--
ALTER TABLE `transactionhistory`
  MODIFY `history_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `wastetypes`
--
ALTER TABLE `wastetypes`
  MODIFY `waste_type_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `collectionpointstatushistory`
--
ALTER TABLE `collectionpointstatushistory`
  ADD CONSTRAINT `collectionpointstatushistory_ibfk_1` FOREIGN KEY (`collection_point_id`) REFERENCES `collectionpoints` (`collection_point_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `collectionpointstatushistory_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`);

--
-- Ràng buộc cho bảng `collectionpointwastetypes`
--
ALTER TABLE `collectionpointwastetypes`
  ADD CONSTRAINT `collectionpointwastetypes_ibfk_1` FOREIGN KEY (`collection_point_id`) REFERENCES `collectionpoints` (`collection_point_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `collectionpointwastetypes_ibfk_2` FOREIGN KEY (`waste_type_id`) REFERENCES `wastetypes` (`waste_type_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `images`
--
ALTER TABLE `images`
  ADD CONSTRAINT `images_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `images_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`transaction_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `passwordresets`
--
ALTER TABLE `passwordresets`
  ADD CONSTRAINT `passwordresets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `recyclingprocesses`
--
ALTER TABLE `recyclingprocesses`
  ADD CONSTRAINT `recyclingprocesses_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`transaction_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `recyclingprocesses_ibfk_2` FOREIGN KEY (`waste_type_id`) REFERENCES `wastetypes` (`waste_type_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `reportdetails`
--
ALTER TABLE `reportdetails`
  ADD CONSTRAINT `reportdetails_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`report_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportdetails_ibfk_2` FOREIGN KEY (`waste_type_id`) REFERENCES `wastetypes` (`waste_type_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `rewards`
--
ALTER TABLE `rewards`
  ADD CONSTRAINT `rewards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `rewards_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`transaction_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `transactionhistory`
--
ALTER TABLE `transactionhistory`
  ADD CONSTRAINT `transactionhistory_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`transaction_id`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`collection_point_id`) REFERENCES `collectionpoints` (`collection_point_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`waste_type_id`) REFERENCES `wastetypes` (`waste_type_id`) ON DELETE SET NULL;

--
-- Ràng buộc cho bảng `userroles`
--
ALTER TABLE `userroles`
  ADD CONSTRAINT `userroles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `userroles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
