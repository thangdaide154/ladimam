# Hướng Dẫn Cấu Hình DNS CNAME Trỏ Subdomain Về GitHub Pages

Tài liệu hướng dẫn chi tiết cách tạo và trỏ Subdomain (tên miền con) từ các nhà quản lý tên miền phổ biến tại Việt Nam về GitHub Pages để chạy Landing Page bán hàng.

---

## 🎯 Bản Ghi DNS Cần Thêm

| Loại Bản Ghi (Record Type) | Tên Bản Ghi (Host / Name) | Giá Trị (Value / Points to) | TTL |
| :--- | :--- | :--- | :--- |
| **`CNAME`** | Tên subdomain (ví dụ: `mx`, `shop`, `deal`, `sale`) | **`<username>.github.io`** | **`300`** (hoặc Mặc định) |

> [!WARNING]
> **Tuyệt đối KHÔNG** thêm tiền tố `https://` và **KHÔNG** thêm đường dẫn thư mục `/tên_kho/` vào ô Giá trị.
> * Đúng: `thangdaide154.github.io`
> * Sai: `https://thangdaide154.github.io/ladimam/`

---

## 📋 Hướng Dẫn Từng Nhà Cung Cấp Tên Miền

### 1. iNET (OnePortal)
1. Đăng nhập [portal.inet.vn](https://portal.inet.vn).
2. Vào **Danh sách tên miền** ➔ Tại dòng tên miền chính (ví dụ: `rexin.vn`), bấm nút **`📄 Bản ghi`**.
3. Bấm nút màu xanh **`+ Thêm bản ghi`**:
   * **Tên bản ghi:** `mx` (hoặc tên subdomain bạn chọn).
   * **Loại:** Chọn `CNAME`.
   * **Giá trị:** `<username>.github.io` (ví dụ: `thangdaide154.github.io`).
   * **TTL:** `300`.
4. Bấm **Lưu** / **Xác nhận**.

---

### 2. Cloudflare
1. Đăng nhập Cloudflare Dashboard ➔ Chọn tên miền của bạn ➔ Vào mục **DNS** > **Records**.
2. Bấm **Add record**:
   * **Type:** `CNAME`
   * **Name:** `mx` (hoặc subdomain tùy chọn)
   * **Target:** `<username>.github.io`
   * **Proxy status:** Bật **Proxied** (Đám mây màu cam để có SSL tức thì 1 giây) HOẶC **DNS only** (Đám mây màu xám nếu muốn dùng trực tiếp chứng chỉ của GitHub).
3. Bấm **Save**.

---

### 3. PA Việt Nam (dotVNDNS) & Mắt Bão
1. Đăng nhập vào trang quản trị tên miền của PA Việt Nam hoặc Mắt Bão.
2. Tìm mục **Quản lý DNS** của tên miền.
3. Thêm bản ghi:
   * **Host:** `mx`
   * **Loại bản ghi:** `CNAME`
   * **Giá trị:** `<username>.github.io.` *(Lưu ý: Một số giao diện yêu cầu có dấu chấm `.` ở cuối)*.
4. Bấm **Lưu cấu hình**.

---

## 🔍 Kiểm Tra Tín Hiệu DNS Trên Máy Tính
Mở PowerShell hoặc Command Prompt và gõ lệnh:
```powershell
Resolve-DnsName -Name "mx.rexin.vn" -Type CNAME
# hoặc
nslookup mx.rexin.vn 8.8.8.8
```
Nếu màn hình trả về `thangdaide154.github.io` là DNS đã trỏ thành công 100%!
