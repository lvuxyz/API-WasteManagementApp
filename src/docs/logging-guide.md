# Hướng dẫn sử dụng Logger trong API Waste Management

Tài liệu này hướng dẫn cách sử dụng logger một cách hiệu quả trong ứng dụng API Waste Management.

## Tổng quan

Hệ thống logging được thiết kế để cung cấp thông tin chi tiết về hoạt động của API, bao gồm:

- Thông tin về controller và function đang được gọi
- Thông tin về request (URL, method, IP, user agent)
- Chi tiết về dữ liệu đầu vào và đầu ra
- Chi tiết lỗi nếu có

## Cấu trúc Log

Logs được lưu trong thư mục `/logs` với các file sau:

- `combined.log`: Tất cả các log
- `error.log`: Chỉ log lỗi
- `api.log`: Log liên quan đến API

## Sử dụng Logger Cơ Bản

Logger cơ bản của hệ thống sử dụng winston. Bạn có thể sử dụng trực tiếp để ghi log:

```javascript
const logger = require("../utils/logger");

// Ghi log thông tin
logger.info("Thông tin đơn giản");

// Ghi log lỗi
logger.error("Đã xảy ra lỗi", { error: err });

// Ghi log cảnh báo
logger.warn("Cảnh báo");
```

## Sử dụng API Logger

Để log đầy đủ thông tin cho các chức năng API, chúng ta sử dụng `apiLogger` cung cấp các hàm tiện ích:

```javascript
const {
  logApiFunction,
  logApiError,
  logApiWarning,
} = require("../utils/apiLogger");

// Log một chức năng API
logApiFunction(
  "userController",
  "getUsers",
  "Đang lấy danh sách người dùng",
  req,
  { limit: 10 }
);

// Log lỗi API
logApiError(
  "userController",
  "getUsers",
  "Không thể lấy danh sách người dùng",
  req,
  error,
  { query: req.query }
);

// Log cảnh báo API
logApiWarning("userController", "login", "Đăng nhập thất bại nhiều lần", req, {
  attempts: 3,
});
```

## Sử dụng Controller Logger

Cách tối ưu nhất để sử dụng logging trong controller là tạo một logger riêng cho controller:

```javascript
const { createControllerLogger } = require("../utils/apiLogger");

// Tạo logger cho controller cụ thể
const CONTROLLER_NAME = "authController";
const logger = createControllerLogger(CONTROLLER_NAME);

// Trong các hàm controller
exports.login = async (req, res, next) => {
  const FUNCTION_NAME = "login";
  try {
    // Log bắt đầu hàm
    logger.logFunction(FUNCTION_NAME, "Đăng nhập", req, {
      username: req.body.username,
    });

    // Xử lý logic...

    // Log kết thúc thành công
    logger.logFunction(FUNCTION_NAME, "Đăng nhập thành công", req, {
      userId: user.id,
    });

    res.json({ success: true });
  } catch (error) {
    // Log lỗi
    logger.logError(FUNCTION_NAME, "Đăng nhập thất bại", req, error);
    next(error);
  }
};
```

## Quy tắc ghi log

1. **Thời điểm ghi log**:

   - Bắt đầu thực thi một chức năng API
   - Kết thúc thành công
   - Khi xảy ra lỗi
   - Khi có các điều kiện đặc biệt

2. **Dữ liệu cần log**:

   - **Controller name**: Tên của controller
   - **Function name**: Tên của function
   - **Message**: Mô tả ngắn gọn về hành động
   - **Request info**: Thông tin về request
   - **Additional data**: Dữ liệu liên quan (ẩn thông tin nhạy cảm)

3. **Mức độ log**:
   - `info`: Thông tin bình thường về luồng thực thi
   - `warn`: Cảnh báo, đăng nhập thất bại, dữ liệu không hợp lệ
   - `error`: Lỗi xảy ra, ngăn chặn luồng thực thi bình thường

## Ví dụ thực tế

```javascript
// Đăng ký người dùng
exports.register = async (req, res, next) => {
  const FUNCTION_NAME = "register";
  try {
    // Log bắt đầu
    logger.logFunction(FUNCTION_NAME, "Đăng ký người dùng mới", req);

    // Xác thực dữ liệu
    if (!req.body.email) {
      logger.logWarning(FUNCTION_NAME, "Thiếu email", req);
      return next(new ValidationError("Email là bắt buộc"));
    }

    // Log kết quả thành công
    logger.logFunction(FUNCTION_NAME, "Đăng ký thành công", req, {
      userId: newUser.id,
      email: newUser.email,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    // Log lỗi
    logger.logError(FUNCTION_NAME, "Đăng ký thất bại", req, error);
    next(error);
  }
};
```

## Best Practices

1. Luôn đặt tên controller và function rõ ràng
2. Log đủ thông tin để debug nhưng không quá chi tiết
3. Không log thông tin nhạy cảm (mật khẩu, token, etc.)
4. Ghi log ở đầu và cuối mỗi function
5. Log chi tiết lỗi trong khối catch
