-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost:3306
-- Thời gian đã tạo: Th4 29, 2025 lúc 08:56 PM
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
CREATE DATABASE IF NOT EXISTS `quanliracthai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `quanliracthai`;

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
(1, 'Điểm Thu Gom Số 1', '123 Đường ABC, Quận 1, TP HCM', 10.77360000, 106.70340000, '08:00 - 17:00', 1000.00, 0.00, 'active');

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
(5, 1, 'full', '2025-04-06 23:06:23', 1),
(6, 1, 'active', '2025-04-08 00:01:18', 1);

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

--
-- Đang đổ dữ liệu cho bảng `passwordresets`
--

INSERT INTO `passwordresets` (`id`, `user_id`, `reset_token`, `expires_at`, `created_at`) VALUES
(1, 1, 'd1c5b65888de3aed64423d9b5cf924a4447fe2ba532a59f0f1dc0d6c491117b1', '2025-04-15 18:45:37', '2025-04-15 18:30:37');

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

--
-- Đang đổ dữ liệu cho bảng `recyclingprocesses`
--

INSERT INTO `recyclingprocesses` (`process_id`, `transaction_id`, `waste_type_id`, `processed_quantity`, `start_date`, `end_date`, `status`) VALUES
(1, 1, 4, 75.50, '2025-04-30 02:33:16', NULL, 'in_progress');

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

--
-- Đang đổ dữ liệu cho bảng `rewards`
--

INSERT INTO `rewards` (`reward_id`, `user_id`, `transaction_id`, `points`, `earned_date`) VALUES
(1, 1, 1, 27500, '2025-04-08 00:07:44');

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

--
-- Đang đổ dữ liệu cho bảng `transactionhistory`
--

INSERT INTO `transactionhistory` (`history_id`, `transaction_id`, `status`, `changed_at`) VALUES
(1, 1, 'pending', '2025-04-08 00:02:10'),
(2, 2, 'pending', '2025-04-08 00:06:51'),
(3, 1, 'completed', '2025-04-08 00:07:44'),
(4, 3, 'pending', '2025-04-17 17:31:03'),
(5, 8, 'pending', '2025-04-23 18:37:33'),
(6, 8, 'verified', '2025-04-23 18:44:54');

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

--
-- Đang đổ dữ liệu cho bảng `transactions`
--

INSERT INTO `transactions` (`transaction_id`, `user_id`, `collection_point_id`, `waste_type_id`, `quantity`, `unit`, `transaction_date`, `status`, `proof_image_url`) VALUES
(1, 1, 1, 4, 5.50, 'kg', '2025-04-08 00:02:10', 'completed', 'https://example.com/image.jpg'),
(2, 1, 1, 4, 5.50, 'kg', '2025-04-08 00:06:51', 'pending', 'https://example.com/image.jpg'),
(3, 1, 1, 4, 5.50, 'kg', '2025-04-17 17:31:03', 'pending', 'https://example.com/image.jpg'),
(8, 1, 1, 4, 10.50, 'kg', '2025-04-23 18:37:33', 'verified', 'uploads/images/proof-123.jpg');

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
(4, 2),
(5, 2);

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
  `login_attempts` int DEFAULT '0',
  `lock_until` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT (now())
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `username`, `email`, `password_hash`, `phone`, `address`, `status`, `login_attempts`, `lock_until`, `created_at`) VALUES
(1, 'Admin User', 'admin', 'lvu.byte@gmail.com', '$2a$10$b0BVVqKE4PNCGFRohM/J4.NeZfDMnkqE8CP2HPO2oH4orxDmbOxsC', '0332265689', 'Hà Nội', 'active', 0, NULL, '2025-04-06 21:20:59'),
(4, 'Van Hai', 'lvuxyz0', 'vanhai@gmail.com', '$2a$10$kr/FXn/wY0akFDWr2RcuBOz4h70G5AsUUQb/k.Wthul47AZcq.UTe', '0999987567', 'Hà Nội', 'active', 0, NULL, '2025-04-06 21:34:02'),
(5, 'nguyễn văn vũ', 'lvuxyz1', 'vungo19092003@gmail.com', '$2a$10$Tn4wExL4OMYN/yokrojEjuyy1GEHGRQLmY2drJcSWwsoxoNusfNZ.', '0332265689', 'Quảng Ninh', 'active', 0, NULL, '2025-04-24 02:13:28');

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
-- Đang đổ dữ liệu cho bảng `wastetypes`
--

INSERT INTO `wastetypes` (`waste_type_id`, `name`, `description`, `recyclable`, `handling_instructions`, `unit_price`) VALUES
(4, 'Nhựa tái chế', 'Các loại nhựa có thể tái chế', 1, 'Rửa sạch trước khi thu gom', 5000.00),
(5, 'Giấy và Bìa Carton', 'Bao gồm giấy văn phòng, báo, tạp chí, hộp giấy, bìa carton và các sản phẩm giấy có thể tái chế', 1, '- Đảm bảo giấy khô và sạch\n- Tách riêng giấy trắng và giấy màu\n- Gấp phẳng các hộp carton\n- Loại bỏ băng keo, kim bấm\n- Không thu gom giấy đã bị nhiễm dầu mỡ hoặc thực phẩm', 3000.00),
(6, 'Kim Loại', 'Các loại kim loại như sắt, nhôm, đồng, thiếc và các sản phẩm kim loại có thể tái chế', 1, '- Rửa sạch và làm khô\n- Tách riêng các loại kim loại khác nhau\n- Làm bẹp lon/hộp để tiết kiệm không gian\n- Loại bỏ các phần không phải kim loại\n- Không thu gom bình xịt còn ga hoặc vật liệu dễ cháy nổ', 15000.00),
(7, 'Thủy Tinh', 'Chai lọ, bình thủy tinh các loại, kính cường lực và các sản phẩm thủy tinh có thể tái chế', 1, '- Rửa sạch và làm khô\n- Tháo bỏ nắp và nhãn\n- Phân loại theo màu sắc (trắng, xanh, nâu)\n- Không thu gom thủy tinh đã vỡ\n- Đóng gói cẩn thận tránh vỡ khi vận chuyển', 2000.00),
(8, 'Rác Thải Điện Tử', 'Thiết bị điện tử cũ, hỏng như điện thoại, máy tính, pin, linh kiện điện tử và các thiết bị điện', 1, '- Xóa dữ liệu cá nhân khỏi thiết bị\n- Tháo pin và xử lý riêng\n- Đóng gói cẩn thận tránh va đập\n- Không tháo rời thiết bị khi không cần thiết\n- Bảo quản ở nơi khô ráo', 25000.00),
(9, 'Rác Thải Hữu Cơ', 'Rác thải từ thực phẩm, rau củ, trái cây, lá cây và các chất thải hữu cơ có thể phân hủy', 1, '- Tách riêng khỏi các loại rác khác\n- Không trộn với rác thải độc hại\n- Đựng trong túi hoặc thùng kín\n- Thu gom và xử lý trong vòng 24 giờ\n- Có thể dùng làm phân compost', 1000.00),
(10, 'Rác Thải Y Tế', 'Chất thải từ hoạt động y tế như kim tiêm, băng gạc, vật liệu nhiễm khuẩn, thuốc hết hạn và các vật dụng y tế đã qua sử dụng', 0, '- Phải được đóng gói trong túi/thùng màu vàng chuyên dụng\n- Không trộn lẫn với rác thải thông thường\n- Cần được xử lý bởi đơn vị chuyên môn\n- Phải được tiêu hủy theo quy trình nghiêm ngặt\n- Yêu cầu giấy phép xử lý đặc biệt', 0.00),
(11, 'Chất Thải Độc Hại', 'Hóa chất độc hại, dung môi, thuốc trừ sâu, sơn, dầu nhớt thải và các chất độc hại khác', 0, '- Không đổ xuống cống rãnh hoặc nguồn nước\n- Giữ nguyên trong container gốc nếu có thể\n- Không trộn lẫn các loại hóa chất\n- Cần được xử lý bởi đơn vị có chuyên môn\n- Lưu trữ ở nơi khô ráo, thoáng mát', 0.00),
(12, 'Rác Thải Hỗn Hợp Bẩn', 'Rác thải sinh hoạt bẩn, tã lót, băng vệ sinh, vật liệu bị nhiễm dầu mỡ, thực phẩm', 0, '- Đóng gói kín trong túi rác\n- Thu gom hàng ngày\n- Không trộn với rác tái chế\n- Cần được xử lý tại bãi rác\n- Tránh để rò rỉ nước rác', 0.00),
(13, 'Vật Liệu Composite', 'Vật liệu tổng hợp không thể tách rời như bao bì nhiều lớp, vật liệu cách nhiệt, một số loại bao bì thực phẩm', 0, '- Không thể tái chế do cấu tạo phức tạp\n- Thu gom riêng với rác tái chế\n- Xử lý bằng phương pháp chôn lấp hoặc đốt\n- Hạn chế sử dụng các vật liệu này\n- Tìm kiếm các sản phẩm thay thế', 0.00),
(14, 'Thủy Tinh Chịu Nhiệt', 'Thủy tinh pyrex, gốm sứ vỡ, kính cường lực vỡ, bóng đèn và các loại thủy tinh đặc biệt', 0, '- Đóng gói cẩn thận tránh gây sát thương\n- Không trộn với thủy tinh thông thường\n- Không thể tái chế do thành phần đặc biệt\n- Xử lý riêng tại bãi rác\n- Đánh dấu rõ là vật sắc nhọn', 0.00),
(15, 'Vật Liệu Amiăng', 'Vật liệu cách nhiệt, tấm lợp, ống dẫn có chứa amiăng - chất gây ung thư', 0, '- Không được đập vỡ hoặc cắt\n- Phải được xử lý bởi chuyên gia\n- Đóng gói kín và dán nhãn cảnh báo\n- Cần giấy phép xử lý đặc biệt\n- Không được tái sử dụng dưới mọi hình thức', 0.00);

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
  MODIFY `status_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `images`
--
ALTER TABLE `images`
  MODIFY `image_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `passwordresets`
--
ALTER TABLE `passwordresets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `recyclingprocesses`
--
ALTER TABLE `recyclingprocesses`
  MODIFY `process_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `rewards`
--
ALTER TABLE `rewards`
  MODIFY `reward_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `transactionhistory`
--
ALTER TABLE `transactionhistory`
  MODIFY `history_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `wastetypes`
--
ALTER TABLE `wastetypes`
  MODIFY `waste_type_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

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
--
-- Cơ sở dữ liệu: `quanlitau`
--
CREATE DATABASE IF NOT EXISTS `quanlitau` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `quanlitau`;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `delete_history`
--

CREATE TABLE `delete_history` (
  `History_ID` int NOT NULL,
  `Request_ID` int DEFAULT NULL,
  `Action_Type` enum('REQUEST','APPROVE','REJECT') COLLATE utf8mb4_general_ci NOT NULL,
  `Action_By` int NOT NULL,
  `Action_Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Details` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `delete_requests`
--

CREATE TABLE `delete_requests` (
  `Request_ID` int NOT NULL,
  `Resource_Type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Loại tài nguyên (TRAIN, ROLE, SCHEDULE, etc.)',
  `Resource_ID` int NOT NULL COMMENT 'ID của tài nguyên cần xóa',
  `Requester_ID` int NOT NULL COMMENT 'ID của người yêu cầu xóa',
  `Request_Reason` text COLLATE utf8mb4_general_ci COMMENT 'Lý do yêu cầu xóa',
  `Status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Approved_By` int DEFAULT NULL COMMENT 'ID của admin xử lý yêu cầu',
  `Response_Note` text COLLATE utf8mb4_general_ci COMMENT 'Ghi chú phản hồi của admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `issues`
--

CREATE TABLE `issues` (
  `Issue_ID` int NOT NULL,
  `Schedule_ID` int DEFAULT NULL,
  `Issue_Type` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Severity_Level` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Issue_Description` text COLLATE utf8mb4_general_ci,
  `Report_Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Resolution_Status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Resolution_Time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `Resolution_Details` text COLLATE utf8mb4_general_ci,
  `Reported_By` int DEFAULT NULL,
  `Resolved_By` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `Notification_ID` int NOT NULL,
  `User_ID` int DEFAULT NULL,
  `Schedule_ID` int DEFAULT NULL,
  `Type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Content` text COLLATE utf8mb4_general_ci,
  `Status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Sent_Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Read_Time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `passengers`
--

CREATE TABLE `passengers` (
  `Passenger_ID` int NOT NULL,
  `User_ID` int DEFAULT NULL,
  `Registration_Date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `passengers`
--

INSERT INTO `passengers` (`Passenger_ID`, `User_ID`, `Registration_Date`) VALUES
(1, 3, '2025-02-19'),
(2, 4, '2025-02-19');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `passenger_preferences`
--

CREATE TABLE `passenger_preferences` (
  `Preference_ID` int NOT NULL,
  `Passenger_ID` int DEFAULT NULL,
  `Preferred_Seat_Type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Meal_Preference` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Communication_Preference` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `password_resets`
--

CREATE TABLE `password_resets` (
  `User_ID` int NOT NULL,
  `Token` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Expires_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Used` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `password_resets`
--

INSERT INTO `password_resets` (`User_ID`, `Token`, `Created_At`, `Expires_At`, `Used`) VALUES
(4, 'aa2b2f24c8ecbef7d1b7dae93772dd9876d348e9d6ebd45c504d9489e1c9616e', '2025-03-09 10:36:16', '2025-03-09 11:36:16', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `Payment_ID` int NOT NULL,
  `Ticket_ID` int DEFAULT NULL,
  `Payment_Method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Amount` decimal(10,2) DEFAULT NULL,
  `Payment_Date` date DEFAULT NULL,
  `Status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Transaction_ID` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `price_rules`
--

CREATE TABLE `price_rules` (
  `Rule_ID` int NOT NULL,
  `Type_ID` int DEFAULT NULL,
  `Condition_Type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Condition_Value` text COLLATE utf8mb4_general_ci,
  `Price_Adjustment` decimal(10,2) DEFAULT NULL,
  `Start_Date` date DEFAULT NULL,
  `End_Date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reports`
--

CREATE TABLE `reports` (
  `Report_ID` int NOT NULL,
  `Date` date DEFAULT NULL,
  `Report_Type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Ticket_Sales` int DEFAULT NULL,
  `Revenue` decimal(15,2) DEFAULT NULL,
  `On_Time_Percentage` decimal(5,2) DEFAULT NULL,
  `Total_Trips` int DEFAULT NULL,
  `Cancellation_Rate` decimal(5,2) DEFAULT NULL,
  `Average_Delay` int DEFAULT NULL,
  `Created_By` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `Role_ID` int NOT NULL,
  `Role_Name` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Description` text COLLATE utf8mb4_general_ci,
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`Role_ID`, `Role_Name`, `Description`, `Created_At`, `Updated_At`) VALUES
(1, 'ADMIN', 'Quản trị viên với toàn quyền trong hệ thống', '2025-02-19 07:38:45', '2025-02-19 08:11:40'),
(2, 'STAFF', 'Nhân viên quản lý với quyền hạn chế', '2025-02-19 07:38:45', '2025-02-19 08:11:40'),
(3, 'USER', 'Người dùng thông thường của hệ thống', '2025-02-19 07:38:45', '2025-02-19 08:11:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `schedules`
--

CREATE TABLE `schedules` (
  `Schedule_ID` int NOT NULL,
  `Train_ID` int DEFAULT NULL,
  `Departure_Date` date DEFAULT NULL,
  `Departure_Time` time DEFAULT NULL,
  `Arrival_Time` time DEFAULT NULL,
  `Departure_Station` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Arrival_Station` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Schedule_Status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Estimated_Delay` int DEFAULT NULL,
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Updated_At` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `schedules`
--

INSERT INTO `schedules` (`Schedule_ID`, `Train_ID`, `Departure_Date`, `Departure_Time`, `Arrival_Time`, `Departure_Station`, `Arrival_Station`, `Schedule_Status`, `Estimated_Delay`, `Created_At`, `Updated_At`) VALUES
(1, 1, '2025-03-15', '08:00:00', '12:30:00', 'Hà Nội', 'Đà Nẵng', 'PENDING', NULL, '2025-03-18 19:09:48', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `schedule_changes`
--

CREATE TABLE `schedule_changes` (
  `Change_ID` int NOT NULL,
  `Schedule_ID` int DEFAULT NULL,
  `Change_Type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Old_Value` text COLLATE utf8mb4_general_ci,
  `New_Value` text COLLATE utf8mb4_general_ci,
  `Change_Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Changed_By` int DEFAULT NULL,
  `Reason` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `schedule_stops`
--

CREATE TABLE `schedule_stops` (
  `Stop_ID` int NOT NULL,
  `Schedule_ID` int DEFAULT NULL,
  `Station_ID` int DEFAULT NULL,
  `Arrival_Time` time DEFAULT NULL,
  `Departure_Time` time DEFAULT NULL,
  `Stop_Order` int DEFAULT NULL,
  `Platform_Number` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `schedule_stops`
--

INSERT INTO `schedule_stops` (`Stop_ID`, `Schedule_ID`, `Station_ID`, `Arrival_Time`, `Departure_Time`, `Stop_Order`, `Platform_Number`) VALUES
(1, 1, 1, '09:30:00', '09:40:00', 1, 'P2'),
(2, 1, 2, '11:00:00', '11:10:00', 2, 'P1');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `seat_configuration`
--

CREATE TABLE `seat_configuration` (
  `Config_ID` int NOT NULL,
  `Train_ID` int DEFAULT NULL,
  `Car_Number` int DEFAULT NULL,
  `Seat_Layout` text COLLATE utf8mb4_general_ci,
  `Seat_Class` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ships`
--

CREATE TABLE `ships` (
  `Ship_ID` int NOT NULL,
  `Ship_Name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `Ship_Type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `Capacity` int NOT NULL,
  `Facilities` text COLLATE utf8mb4_general_ci,
  `Status` enum('ACTIVE','MAINTENANCE','OUT_OF_SERVICE','RESERVED') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'ACTIVE',
  `Build_Year` int DEFAULT NULL,
  `Maintenance_History` text COLLATE utf8mb4_general_ci,
  `Operator` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Registration_Number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stations`
--

CREATE TABLE `stations` (
  `Station_ID` int NOT NULL,
  `Station_Name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Number_of_Lines` int DEFAULT NULL,
  `Facilities` text COLLATE utf8mb4_general_ci,
  `Operating_Hours` text COLLATE utf8mb4_general_ci,
  `Contact_Info` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `stations`
--

INSERT INTO `stations` (`Station_ID`, `Station_Name`, `Location`, `Number_of_Lines`, `Facilities`, `Operating_Hours`, `Contact_Info`) VALUES
(1, 'Ga Hải Phòng', 'Thành phố Hải Phòng', 3, 'Nhà chờ, Nhà vệ sinh, Quầy bán vé, Căng tin', '05:00-22:00', '0236.3822.113'),
(2, 'Ga Hà Nội', '120 Lê Duẩn, Hà Nội', 6, 'Nhà vệ sinh, Phòng chờ VIP, Quầy bán vé, Cửa hàng tiện lợi, Nhà hàng, Dịch vụ hành lý', '04:30 - 23:00', '024 3825 3949, gahanoi@vr.com.vn'),
(3, 'Ga Sài Gòn', '1 Nguyễn Thông, Phường 9, Quận 3, TP. Hồ Chí Minh', 5, 'Nhà vệ sinh, Phòng chờ, Quầy bán vé, Cửa hàng tiện lợi, Dịch vụ taxi', '05:00 - 22:30', '028 3846 6091, gasaigon@vr.com.vn'),
(4, 'Ga Đà Nẵng', '200 Hải Phòng, Quận Thanh Khê, Đà Nẵng', 4, 'Nhà vệ sinh, Phòng chờ, Quầy bán vé, Cửa hàng tiện lợi', '05:30 - 22:00', '0236 3822 113, gadanang@vr.com.vn'),
(5, 'Ga Huế', '2 Bùi Thị Xuân, Phường Phú Hội, Huế', 3, 'Nhà vệ sinh, Phòng chờ, Quầy bán vé', '06:00 - 21:30', '0234 3822 175, gahue@vr.com.vn'),
(6, 'Ga Nha Trang', '17 Thái Nguyên, Phường Phước Tân, Nha Trang', 3, 'Nhà vệ sinh, Phòng chờ, Quầy bán vé, Dịch vụ lưu trú', '05:30 - 21:00', '0258 3822 113, ganhatrang@vr.com.vn'),
(7, 'Ga Vinh', '1 Trường Thi, Phường Trường Thi, TP. Vinh, Nghệ An', 2, 'Nhà vệ sinh, Quầy bán vé, Phòng chờ', '06:00 - 21:00', '0238 3855 279, gavinh@vr.com.vn'),
(8, 'Ga Thanh Hóa', 'Đường Lê Lợi, Phường Tân Sơn, TP. Thanh Hóa', 2, 'Nhà vệ sinh, Quầy bán vé', '06:30 - 20:30', '0237 3852 503, gathanhhoa@vr.com.vn'),
(9, 'Ga Đồng Hới', '155 Trương Pháp, Phường Đồng Phú, Đồng Hới, Quảng Bình', 2, 'Nhà vệ sinh, Quầy bán vé, Phòng chờ', '06:30 - 20:00', '0232 3824 229, gadonghoi@vr.com.vn'),
(10, 'Ga Diêu Trì', 'Phường Nhơn Phú, TP. Quy Nhơn, Bình Định', 2, 'Nhà vệ sinh, Quầy bán vé', '06:00 - 20:30', '0256 3822 113, gadieutri@vr.com.vn'),
(11, 'Ga Hải Dương', 'Thành phố Hải Dương', 3, 'Nhà chờ, Nhà vệ sinh, Quầy bán vé, Căng tin', '05:00-22:00', '0236.3822.113');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tickets`
--

CREATE TABLE `tickets` (
  `Ticket_ID` int NOT NULL,
  `Schedule_ID` int DEFAULT NULL,
  `Type_ID` int DEFAULT NULL,
  `Passenger_ID` int DEFAULT NULL,
  `Seat_Number` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Car_Number` int DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `Booking_Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Cancellation_Status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Refund_Status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ticket_history`
--

CREATE TABLE `ticket_history` (
  `History_ID` int NOT NULL,
  `Ticket_ID` int DEFAULT NULL,
  `Action` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Action_Time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Performed_By` int DEFAULT NULL,
  `Details` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ticket_types`
--

CREATE TABLE `ticket_types` (
  `Type_ID` int NOT NULL,
  `Name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Description` text COLLATE utf8mb4_general_ci,
  `Base_Price` decimal(10,2) DEFAULT NULL,
  `Cancellation_Policy` text COLLATE utf8mb4_general_ci,
  `Refund_Percentage` decimal(5,2) DEFAULT NULL,
  `Validity_Period` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `trains`
--

CREATE TABLE `trains` (
  `Train_ID` int NOT NULL,
  `Train_Type` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Train_Operator` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Capacity` int DEFAULT NULL,
  `Amenities` text COLLATE utf8mb4_general_ci,
  `Status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Maintenance_Schedule` text COLLATE utf8mb4_general_ci,
  `Last_Maintenance_Date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `trains`
--

INSERT INTO `trains` (`Train_ID`, `Train_Type`, `Train_Operator`, `Capacity`, `Amenities`, `Status`, `Maintenance_Schedule`, `Last_Maintenance_Date`) VALUES
(1, 'EXPRESS', 'Vietnam Railways', 300, '{\"hasWifi\":true,\"hasFood\":true,\"hasAirCon\":true,\"hasBedding\":true,\"hasToilet\":true}', 'ACTIVE', 'Bảo dưỡng định kỳ hàng tháng', '2024-03-15'),
(2, 'Tàu cao tốc', 'Vietnam Railways', 300, '{\"hasWifi\":true,\"hasFood\":true,\"hasAirCon\":true,\"hasBedding\":true,\"hasToilet\":true}', 'ACTIVE', 'Bảo dưỡng định kỳ hàng tháng', '2024-03-15');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `User_ID` int NOT NULL,
  `Username` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Password` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `First_Name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Last_Name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Phone_Number` varchar(15) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Role_ID` int DEFAULT NULL,
  `Account_Status` enum('ACTIVE','INACTIVE','BANNED','PENDING') COLLATE utf8mb4_general_ci DEFAULT 'ACTIVE',
  `Last_Login` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Created_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`User_ID`, `Username`, `Email`, `Password`, `First_Name`, `Last_Name`, `Phone_Number`, `Role_ID`, `Account_Status`, `Last_Login`, `Created_At`, `Updated_At`) VALUES
(3, 'testuser1', 'testuser1@example.com', '$2b$10$xn/j/L390D5/te.r2OrN3.tspdR0/mLi4CrwmHfLFLnsVATAWtzq6', 'Test', 'User', '0723456789', 3, 'ACTIVE', '2025-02-19 08:19:09', '2025-02-19 07:38:51', '2025-02-19 08:19:09'),
(4, 'admin', 'lvu.byte@gmail.com', '$2b$10$x758HSoh0BoDrxQUqh3.RuOo37ya9QT5T20wb3ycNWiPVQHzt2gey', 'Admin', 'User', '0777231909', 1, 'ACTIVE', '2025-03-19 09:44:02', '2025-02-19 08:22:02', '2025-03-19 09:44:02'),
(5, 'staff', 'staff@example.com', '$2b$10$xsTecOp1hzIT5zyWAtqNdu8hsx1frv/jvrXKpxBel4b7J8pRoj8uG', 'Staff', 'User', '0723456788', 2, 'ACTIVE', '2025-02-19 08:33:58', '2025-02-19 08:33:31', '2025-02-19 08:33:58'),
(6, 'testuser2', 'testuser2@example.com', '$2b$10$IyVcW4ycYzNl6lXyv45x5eDUNTbcNOyK.rvOpnspV2QUZ7I3ceZem', 'Test', 'User', '0344456789', 3, 'ACTIVE', '2025-03-09 11:13:31', '2025-03-09 11:13:29', '2025-03-09 11:13:31');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `delete_history`
--
ALTER TABLE `delete_history`
  ADD PRIMARY KEY (`History_ID`),
  ADD KEY `Action_By` (`Action_By`),
  ADD KEY `idx_delete_history_request` (`Request_ID`);

--
-- Chỉ mục cho bảng `delete_requests`
--
ALTER TABLE `delete_requests`
  ADD PRIMARY KEY (`Request_ID`),
  ADD KEY `Requester_ID` (`Requester_ID`),
  ADD KEY `Approved_By` (`Approved_By`),
  ADD KEY `idx_delete_requests_status` (`Status`),
  ADD KEY `idx_delete_requests_resource` (`Resource_Type`,`Resource_ID`);

--
-- Chỉ mục cho bảng `issues`
--
ALTER TABLE `issues`
  ADD PRIMARY KEY (`Issue_ID`),
  ADD KEY `Schedule_ID` (`Schedule_ID`),
  ADD KEY `Reported_By` (`Reported_By`),
  ADD KEY `Resolved_By` (`Resolved_By`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`Notification_ID`),
  ADD KEY `User_ID` (`User_ID`),
  ADD KEY `Schedule_ID` (`Schedule_ID`);

--
-- Chỉ mục cho bảng `passengers`
--
ALTER TABLE `passengers`
  ADD PRIMARY KEY (`Passenger_ID`),
  ADD KEY `User_ID` (`User_ID`);

--
-- Chỉ mục cho bảng `passenger_preferences`
--
ALTER TABLE `passenger_preferences`
  ADD PRIMARY KEY (`Preference_ID`),
  ADD KEY `Passenger_ID` (`Passenger_ID`);

--
-- Chỉ mục cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`User_ID`),
  ADD KEY `Token` (`Token`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`Payment_ID`),
  ADD KEY `Ticket_ID` (`Ticket_ID`);

--
-- Chỉ mục cho bảng `price_rules`
--
ALTER TABLE `price_rules`
  ADD PRIMARY KEY (`Rule_ID`),
  ADD KEY `Type_ID` (`Type_ID`);

--
-- Chỉ mục cho bảng `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`Report_ID`),
  ADD KEY `Created_By` (`Created_By`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`Role_ID`);

--
-- Chỉ mục cho bảng `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`Schedule_ID`),
  ADD KEY `Train_ID` (`Train_ID`);

--
-- Chỉ mục cho bảng `schedule_changes`
--
ALTER TABLE `schedule_changes`
  ADD PRIMARY KEY (`Change_ID`),
  ADD KEY `Schedule_ID` (`Schedule_ID`),
  ADD KEY `Changed_By` (`Changed_By`);

--
-- Chỉ mục cho bảng `schedule_stops`
--
ALTER TABLE `schedule_stops`
  ADD PRIMARY KEY (`Stop_ID`),
  ADD KEY `Schedule_ID` (`Schedule_ID`),
  ADD KEY `Station_ID` (`Station_ID`);

--
-- Chỉ mục cho bảng `seat_configuration`
--
ALTER TABLE `seat_configuration`
  ADD PRIMARY KEY (`Config_ID`),
  ADD KEY `Train_ID` (`Train_ID`);

--
-- Chỉ mục cho bảng `ships`
--
ALTER TABLE `ships`
  ADD PRIMARY KEY (`Ship_ID`),
  ADD UNIQUE KEY `Ship_Name` (`Ship_Name`);

--
-- Chỉ mục cho bảng `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`Station_ID`);

--
-- Chỉ mục cho bảng `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`Ticket_ID`),
  ADD KEY `Schedule_ID` (`Schedule_ID`),
  ADD KEY `Type_ID` (`Type_ID`),
  ADD KEY `Passenger_ID` (`Passenger_ID`);

--
-- Chỉ mục cho bảng `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD PRIMARY KEY (`History_ID`),
  ADD KEY `Ticket_ID` (`Ticket_ID`),
  ADD KEY `Performed_By` (`Performed_By`);

--
-- Chỉ mục cho bảng `ticket_types`
--
ALTER TABLE `ticket_types`
  ADD PRIMARY KEY (`Type_ID`);

--
-- Chỉ mục cho bảng `trains`
--
ALTER TABLE `trains`
  ADD PRIMARY KEY (`Train_ID`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`User_ID`),
  ADD UNIQUE KEY `Username` (`Username`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD KEY `Role_ID` (`Role_ID`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `delete_history`
--
ALTER TABLE `delete_history`
  MODIFY `History_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `delete_requests`
--
ALTER TABLE `delete_requests`
  MODIFY `Request_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `issues`
--
ALTER TABLE `issues`
  MODIFY `Issue_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `Notification_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `passengers`
--
ALTER TABLE `passengers`
  MODIFY `Passenger_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `passenger_preferences`
--
ALTER TABLE `passenger_preferences`
  MODIFY `Preference_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `Payment_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `price_rules`
--
ALTER TABLE `price_rules`
  MODIFY `Rule_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `reports`
--
ALTER TABLE `reports`
  MODIFY `Report_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `Role_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `schedules`
--
ALTER TABLE `schedules`
  MODIFY `Schedule_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `schedule_changes`
--
ALTER TABLE `schedule_changes`
  MODIFY `Change_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `schedule_stops`
--
ALTER TABLE `schedule_stops`
  MODIFY `Stop_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `seat_configuration`
--
ALTER TABLE `seat_configuration`
  MODIFY `Config_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `ships`
--
ALTER TABLE `ships`
  MODIFY `Ship_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `stations`
--
ALTER TABLE `stations`
  MODIFY `Station_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `tickets`
--
ALTER TABLE `tickets`
  MODIFY `Ticket_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `History_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `ticket_types`
--
ALTER TABLE `ticket_types`
  MODIFY `Type_ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `trains`
--
ALTER TABLE `trains`
  MODIFY `Train_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `User_ID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `delete_history`
--
ALTER TABLE `delete_history`
  ADD CONSTRAINT `delete_history_ibfk_1` FOREIGN KEY (`Request_ID`) REFERENCES `delete_requests` (`Request_ID`),
  ADD CONSTRAINT `delete_history_ibfk_2` FOREIGN KEY (`Action_By`) REFERENCES `users` (`User_ID`);

--
-- Ràng buộc cho bảng `delete_requests`
--
ALTER TABLE `delete_requests`
  ADD CONSTRAINT `delete_requests_ibfk_1` FOREIGN KEY (`Requester_ID`) REFERENCES `users` (`User_ID`),
  ADD CONSTRAINT `delete_requests_ibfk_2` FOREIGN KEY (`Approved_By`) REFERENCES `users` (`User_ID`);

--
-- Ràng buộc cho bảng `issues`
--
ALTER TABLE `issues`
  ADD CONSTRAINT `issues_ibfk_1` FOREIGN KEY (`Schedule_ID`) REFERENCES `schedules` (`Schedule_ID`),
  ADD CONSTRAINT `issues_ibfk_2` FOREIGN KEY (`Reported_By`) REFERENCES `users` (`User_ID`),
  ADD CONSTRAINT `issues_ibfk_3` FOREIGN KEY (`Resolved_By`) REFERENCES `users` (`User_ID`);

--
-- Ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`User_ID`) REFERENCES `users` (`User_ID`),
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`Schedule_ID`) REFERENCES `schedules` (`Schedule_ID`);

--
-- Ràng buộc cho bảng `passengers`
--
ALTER TABLE `passengers`
  ADD CONSTRAINT `passengers_ibfk_1` FOREIGN KEY (`User_ID`) REFERENCES `users` (`User_ID`);

--
-- Ràng buộc cho bảng `passenger_preferences`
--
ALTER TABLE `passenger_preferences`
  ADD CONSTRAINT `passenger_preferences_ibfk_1` FOREIGN KEY (`Passenger_ID`) REFERENCES `passengers` (`Passenger_ID`);

--
-- Ràng buộc cho bảng `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`User_ID`) REFERENCES `users` (`User_ID`) ON DELETE CASCADE;

--
-- Ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`Ticket_ID`) REFERENCES `tickets` (`Ticket_ID`);

--
-- Ràng buộc cho bảng `price_rules`
--
ALTER TABLE `price_rules`
  ADD CONSTRAINT `price_rules_ibfk_1` FOREIGN KEY (`Type_ID`) REFERENCES `ticket_types` (`Type_ID`);

--
-- Ràng buộc cho bảng `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`Created_By`) REFERENCES `users` (`User_ID`);

--
-- Ràng buộc cho bảng `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`Train_ID`) REFERENCES `trains` (`Train_ID`);

--
-- Ràng buộc cho bảng `schedule_changes`
--
ALTER TABLE `schedule_changes`
  ADD CONSTRAINT `schedule_changes_ibfk_1` FOREIGN KEY (`Schedule_ID`) REFERENCES `schedules` (`Schedule_ID`),
  ADD CONSTRAINT `schedule_changes_ibfk_2` FOREIGN KEY (`Changed_By`) REFERENCES `users` (`User_ID`);

--
-- Ràng buộc cho bảng `schedule_stops`
--
ALTER TABLE `schedule_stops`
  ADD CONSTRAINT `schedule_stops_ibfk_1` FOREIGN KEY (`Schedule_ID`) REFERENCES `schedules` (`Schedule_ID`),
  ADD CONSTRAINT `schedule_stops_ibfk_2` FOREIGN KEY (`Station_ID`) REFERENCES `stations` (`Station_ID`);

--
-- Ràng buộc cho bảng `seat_configuration`
--
ALTER TABLE `seat_configuration`
  ADD CONSTRAINT `seat_configuration_ibfk_1` FOREIGN KEY (`Train_ID`) REFERENCES `trains` (`Train_ID`);

--
-- Ràng buộc cho bảng `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`Schedule_ID`) REFERENCES `schedules` (`Schedule_ID`),
  ADD CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`Type_ID`) REFERENCES `ticket_types` (`Type_ID`),
  ADD CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`Passenger_ID`) REFERENCES `passengers` (`Passenger_ID`);

--
-- Ràng buộc cho bảng `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD CONSTRAINT `ticket_history_ibfk_1` FOREIGN KEY (`Ticket_ID`) REFERENCES `tickets` (`Ticket_ID`),
  ADD CONSTRAINT `ticket_history_ibfk_2` FOREIGN KEY (`Performed_By`) REFERENCES `users` (`User_ID`);

--
-- Ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`Role_ID`) REFERENCES `roles` (`Role_ID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
