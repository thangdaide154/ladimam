# Hướng Dẫn Kết Nối Đơn Hàng Về Google Sheet "mamtron"

Hệ thống đã được lập trình sẵn để **tự động đổ dữ liệu chính xác vào sheet có tên `mamtron`**, bao gồm cả **Địa chỉ IP của khách hàng** (đã tinh gọn bỏ cột nguồn đơn). Bạn không cần phải tự gõ tiêu đề cột vì mã script sẽ tự tạo tự động!

---

## ⚡ 3 Bước Hoàn Tất (Chỉ Mất 30 Giây)

### BƯỚC 1: Đăng nhập & Mở Google Sheet
1. Đăng nhập tài khoản Google của bạn tại trang mà bạn vừa mở.
2. Sau khi đăng nhập, Google sẽ tạo cho bạn một file bảng tính mới (đường link trên thanh trình duyệt sẽ đổi thành dạng: `https://docs.google.com/spreadsheets/d/.../edit`).

---

### BƯỚC 2: Dán Code Tự Động (Đã Cài Sẵn Sheet `mamtron` & Cột IP)
1. Trên menu của Google Sheet, bấm:  
   👉 **Tiện ích mở rộng** (Extensions) ➔ **Apps Script**.
2. Xóa hết code mẫu, copy toàn bộ nội dung trong file [google_apps_script.js](file:///c:/Users/NCPC/Desktop/ladimam/google_apps_script.js) và dán vào.
3. Bấm **Lưu** 💾 (hoặc phím `Ctrl + S`).

---

### BƯỚC 3: Triển Khai & Lấy Link
1. Bấm nút màu xanh **"Triển khai" (Deploy)** ở góc trên ➔ Chọn **"Tùy chọn triển khai mới" (New deployment)**.
2. Cấu hình nhanh:
   * **Loại:** Bấm bánh răng ⚙️ ➔ Chọn **Ứng dụng web** (Web app).
   * **Mô tả:** `Đơn hàng mamtron`
   * **Người thực thi (Execute as):** **Tôi (Me)**
   * **Người có quyền truy cập (Who has access):** **Bất kỳ ai (Anyone)**  *(Bắt buộc để khách từ web gửi được đơn vào)*.
3. Bấm **"Triển khai" (Deploy)** ➔ Bấm **Sao chép (Copy)** đường link Web App dạng:  
   `https://script.google.com/macros/s/AKfycb.../exec`
4. Mở trang Landing Page [index.html](file:///c:/Users/NCPC/Desktop/ladimam/index.html), nhấn phím tắt **F2** ➔ Dán link vào ô và bấm **"Lưu Sheet"** là xong!

---

### 🎁 Bạn Không Cần Phải Làm Gì Thêm:
* Code sẽ **tự động tìm hoặc tự tạo sheet tên là `mamtron`**.
* Code sẽ **tự động tạo hàng tiêu đề 7 cột** in đậm nổi bật:  
  `Thời Gian Đặt | Họ Tên | SĐT | Địa Chỉ | Sản Phẩm | Ghi Chú | Địa Chỉ IP`.
* Tự động lưu địa chỉ IP thật của khách hàng để phòng tránh đơn ảo / spam.
* Tự động giữ số `0` đầu số điện thoại.
* **Cài đặt Meta Pixel (Facebook Ads):** Nhấn phím **F2**, nhập mã Pixel ID của bạn và bấm Lưu. Hệ thống sẽ tự động kích hoạt mã theo dõi và bắn sự kiện `CompleteRegistration` (Hoàn tất đăng ký) mỗi khi khách đặt mua.
