# Waste Management App API

API backend cho ứng dụng Waste Management được xây dựng bằng Node.js, Express và MySQL.

## Yêu cầu hệ thống

- Node.js (version 14 trở lên)
- MySQL
- npm hoặc yarn

## Cài đặt

1. Clone repository:

```bash
git clone https://github.com/lvuxyz/API-WasteManagementApp.git
cd API-WasteManagementApp
```

2. Cài đặt các dependencies:

```bash
npm install
```

3. Tạo file .env trong thư mục gốc và cấu hình các biến môi trường:

```env
PORT=3001
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=waste_management_db
```

## Chạy ứng dụng

### Môi trường development:

```bash
npm run dev
```

### Môi trường production:

```bash
npm start
```

Server sẽ chạy tại `http://localhost:3001`

## API Endpoints

- `GET /`: Kiểm tra server hoạt động

### Giao dịch (Transactions)

- `GET /api/transactions/my-transactions`: Lấy danh sách giao dịch của người dùng hiện tại
  - **Yêu cầu:** Cần xác thực (JWT token trong header Authorization)
  - **Query Parameters:**
    - `page`: Số trang (mặc định: 1)
    - `limit`: Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 50)
    - `status`: Lọc theo trạng thái (ví dụ: 'pending', 'completed', 'rejected')
    - `collection_point_id`: Lọc theo ID điểm thu gom
    - `waste_type_id`: Lọc theo loại rác
    - `date_from`: Lọc từ ngày (định dạng: YYYY-MM-DD)
    - `date_to`: Lọc đến ngày (định dạng: YYYY-MM-DD)
  - **Phản hồi:**
    ```json
    {
      "success": true,
      "message": "Lấy danh sách giao dịch của bạn thành công",
      "data": [...],
      "pagination": {
        "total": 20,
        "page": 1,
        "limit": 10,
        "pages": 2
      }
    }
    ```

## Cấu trúc thư mục

```
API-WasteManagementApp/
├── controllers/     # Xử lý logic của routes
├── models/         # MySQL models
├── routes/         # Định nghĩa routes
├── middleware/     # Middleware functions
├── config/         # Cấu hình
├── .env            # Biến môi trường
├── .gitignore      # Git ignore file
├── index.js        # Entry point
└── package.json    # Project dependencies
```

## Công nghệ sử dụng

- Express.js - Web framework
- MySQL - Database
- mysql2 - MySQL client for Node.js
- Cors - Enable CORS
- Dotenv - Environment variables

```

```
