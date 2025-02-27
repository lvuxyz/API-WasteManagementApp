# Waste Management App API

API backend cho ứng dụng Waste Management được xây dựng bằng Node.js, Express và MongoDB.

## Yêu cầu hệ thống

- Node.js (version 14 trở lên)
- MongoDB
- npm hoặc yarn

## Cài đặt

1. Clone repository:

```bash
git clone https://github.com/yourusername/wastemanagementapp.git
cd waste-management-app
```

2. Cài đặt các dependencies:

```bash
npm install
```

3. Tạo file .env trong thư mục gốc và cấu hình các biến môi trường:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/your-database-name
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

## Cấu trúc thư mục

```
API-WasteManagementApp/
├── controllers/     # Xử lý logic của routes
├── models/         # MongoDB models
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
- MongoDB - Database
- Mongoose - MongoDB object modeling
- Cors - Enable CORS
- Dotenv - Environment variables
