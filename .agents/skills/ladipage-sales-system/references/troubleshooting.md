# Bảng Tra Cứu & Xử Lý Sự Cố Kỹ Thuật (Troubleshooting Runbook)

Tổng hợp các lỗi phổ biến trong quá trình dựng Landing Page, kết nối đơn hàng, thông báo Telegram và gắn tên miền riêng kèm giải pháp chuẩn xác nhất.

---

## 1. Vấn Đề Telegram: Khách Đặt Nhưng Không Có Chuông Báo

### Triệu chứng:
Khách điền đơn thành công trên web, Google Sheet có ghi đơn nhưng điện thoại trong nhóm Telegram không rung chuông.

### Nguyên nhân:
1. **Phụ thuộc vào Google Apps Script:** Các phiên bản cũ để Google Apps Script gọi sang Telegram qua `UrlFetchApp.fetch`. Google bắt buộc phải cấp quyền bảo mật (Review Permissions) thủ công trong trình duyệt. Nếu chưa bấm nút "Chạy" (Run) để cấp quyền, Google sẽ âm thầm chặn kết nối này.
2. **Lỗi định dạng Markdown Telegram:** Nếu dùng `parse_mode: "Markdown"`, khi khách gõ tên hoặc địa chỉ có dấu gạch dưới `_`, dấu sao `*` hoặc ngoặc vuông `[ ]`, Telegram API sẽ báo lỗi `400 Bad Request: can't parse entities` và hủy tin nhắn.

### Giải pháp chuẩn xác:
1. **Bắn trực tiếp từ Trình duyệt (Direct Fetch):**
   * Trong file `index.html`, gọi thẳng `fetch('https://api.telegram.org/bot<TOKEN>/sendMessage')`.
   * Telegram Bot API hỗ trợ `Access-Control-Allow-Origin: *` nên chạy được 100% từ mọi trình duyệt và mạng di động (4G/5G/Wifi).
2. **Luôn sử dụng `parse_mode: "HTML"`:**
   * Thay vì dùng Markdown, sử dụng HTML thẻ `<b>`, `<i>`, `<code>`.
   * Sử dụng hàm `escapeHtml()` cho các biến đầu vào từ người dùng để chống lỗi phân tích cú pháp.

---

## 2. Vấn Đề Chứng Chỉ SSL (HTTPS): "Vẫn Chưa Bật SSL / SEC_E_WRONG_PRINCIPAL"

### Triệu chứng:
Đã trỏ CNAME trên iNET hơn 1 tiếng nhưng khi vào `https://subdomain.domain.vn` trình duyệt báo lỗi "Kết nối không an toàn" hoặc `SEC_E_WRONG_PRINCIPAL`.

### Nguyên nhân:
Khi bạn gắn CNAME vào GitHub Pages *trước* khi DNS của nhà mạng hoàn tất cập nhật, tiến trình yêu cầu chứng chỉ tự động của Let's Encrypt bị thất bại ở lần thử đầu tiên và rơi vào trạng thái hàng đợi lùi lũi (backoff / waiting).

### Giải pháp 100% thành công trong 1 phút (CNAME Reset):
1. **Xóa CNAME tạm thời:**
   * Vào GitHub Repo > **Settings** > **Pages** > Xóa tên miền trong ô **Custom domain** ➔ Bấm **Save**.
   * (Hoặc dùng script API: gửi `cname = ""`).
2. **Đợi 5 giây.**
3. **Thêm lại CNAME:**
   * Nhập lại tên miền (ví dụ: `mx.rexin.vn`) vào ô **Custom domain** ➔ Bấm **Save**.
   * Hành động này ép máy chủ GitHub gửi ngay lập tức một yêu cầu cấp mới (ACME challenge) tới Let's Encrypt.
4. **Kiểm tra trạng thái:**
   * Trong vòng 15-30 giây, trạng thái sẽ chuyển thành: `The certificate has been approved`.
   * Tích chọn ô **Enforce HTTPS** (Bắt buộc HTTPS).

---

## 3. Vấn Đề Google Sheet: Mất Số 0 Ở Đầu Số Điện Thoại

### Triệu chứng:
Khách đặt số `0988123456` nhưng trên Google Sheet chỉ hiện `988123456`.

### Nguyên nhân:
Google Sheet tự động hiểu chuỗi số là số nguyên (Integer) và tự loại bỏ số 0 ở đầu.

### Giải pháp:
Trong file Google Apps Script, luôn ép kiểu chuỗi bằng cách thêm dấu nháy đơn `'` vào đầu giá trị:
```javascript
var phone = p.phone ? ("'" + p.phone) : "Chưa có SĐT";
```
Dấu `'` sẽ giữ nguyên số 0 nhưng hoàn toàn ẩn đi trong giao diện bảng tính Google Sheet.

---

## 4. Vấn Đề CORS Khi Gửi Dữ Liệu Sang Google Apps Script

### Triệu chứng:
Trình duyệt báo lỗi đỏ trong Console: `Access to fetch at 'https://script.google.com/...' has been blocked by CORS policy`.

### Giải pháp:
Thêm `mode: 'no-cors'` vào hàm `fetch` trong JavaScript:
```javascript
fetch(targetGSheetUrl, {
  method: 'POST',
  body: urlParams,
  mode: 'no-cors' // Bỏ qua cơ chế kiểm tra CORS của Google
}).catch(err => console.warn(err));
```
Google Apps Script vẫn nhận đủ dữ liệu và ghi vào bảng tính bình thường mà không bị trình duyệt chặn lại.
