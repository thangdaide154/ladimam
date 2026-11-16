/**
 * ===================================================================
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG ĐỔ ĐƠN VÀO SHEET "mamtron"
 * ĐÃ BỎ CỘT NGUỒN ĐƠN - GIỮ NGUYÊN CỘT ĐỊA CHỈ IP
 * Bảng gồm 7 cột: Thời Gian Đặt | Họ Tên | SĐT | Địa Chỉ | Sản Phẩm | Ghi Chú | Địa Chỉ IP
 * Hỗ trợ cả POST và GET, tự động tạo sheet và tiêu đề cột
 * ===================================================================
 */

function doPost(e) {
  return processOrder(e);
}

function doGet(e) {
  return processOrder(e);
}

function processOrder(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000); // Khóa tránh xung đột khi nhiều khách bấm cùng lúc

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Tự động tìm sheet "mamtron" (nếu chưa có thì tự tạo mới)
    var sheet = ss.getSheetByName("mamtron");
    if (!sheet) {
      sheet = ss.insertSheet("mamtron");
    }
    
    // 2. Tự động tạo hàng tiêu đề nếu sheet còn trống (7 cột chuẩn)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Thời Gian Đặt",
        "Họ Và Tên",
        "Số Điện Thoại",
        "Địa Chỉ Nhận Hàng",
        "Sản Phẩm & Giá",
        "Ghi Chú",
        "Địa Chỉ IP"
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#fee2e2");
      sheet.setFrozenRows(1);
    }
    
    // 3. Đọc dữ liệu từ mọi nguồn (URLSearchParams, GET Query, JSON)
    var p = (e && e.parameter) ? e.parameter : {};
    
    if ((!p.name || !p.phone) && e && e.postData && e.postData.contents) {
      try {
        p = JSON.parse(e.postData.contents);
      } catch (err) {
        var parts = e.postData.contents.split("&");
        for (var i = 0; i < parts.length; i++) {
          var pair = parts[i].split("=");
          if (pair.length === 2) {
            p[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1].replace(/\+/g, " "));
          }
        }
      }
    }
    
    var time = p.time || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    var name = p.name || "Khách đặt hàng";
    var phone = p.phone ? ("'" + p.phone) : "Chưa có SĐT"; // Thêm ' để giữ số 0
    var address = p.address || "";
    var product = p.product || "";
    var note = p.note || "";
    var ip = p.ip || "Không xác định";
    
    // 4. Ghi trực tiếp vào sheet "mamtron" (7 cột)
    sheet.appendRow([time, name, phone, address, product, note, ip]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã lưu đơn vào sheet mamtron thành công!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
