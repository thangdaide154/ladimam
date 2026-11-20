/**
 * ===================================================================
 * BẢN MẪU GOOGLE APPS SCRIPT - TỰ ĐỘNG ĐỔ ĐƠN HÀNG VỀ GOOGLE SHEET
 * Tự động tạo Tab theo tên sản phẩm & tạo 7 cột chuẩn:
 * Thời Gian Đặt | Họ Tên | SĐT | Địa Chỉ | Sản Phẩm & Giá | Ghi Chú | Địa Chỉ IP
 * ===================================================================
 */

// ===================================================================
// 1. CẤU HÌNH TÊN TAB VÀ TELEGRAM (DÀNH CHO CHỦ SHOP)
// ===================================================================
var TARGET_SHEET_NAME = "don_hang"; // Tên tab muốn lưu đơn (tự tạo nếu chưa có)
var TELEGRAM_BOT_TOKEN = "";       // Điền Bot Token từ @BotFather (ví dụ: "8947219302:AAFA...")
var TELEGRAM_CHAT_ID = "";         // Điền Chat ID của Nhóm Telegram (ví dụ: "-5440398762")

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
    
    // 1. Tự động tìm sheet (nếu chưa có thì tự động tạo mới)
    var sheet = ss.getSheetByName(TARGET_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(TARGET_SHEET_NAME);
    }
    
    // 2. Tự động tạo hàng tiêu đề 7 cột chuẩn nếu sheet còn trống
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
    
    // 3. Đọc dữ liệu từ form gửi sang (hỗ trợ URLSearchParams, POST JSON và GET)
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
    var phone = p.phone ? ("'" + p.phone) : "Chưa có SĐT"; // Thêm ' để giữ số 0 đầu
    var address = p.address || "";
    var product = p.product || "";
    var note = p.note || "";
    var ip = p.ip || "Không xác định";
    
    // 4. Ghi trực tiếp vào Google Sheet (7 cột)
    sheet.appendRow([time, name, phone, address, product, note, ip]);

    var orderData = {
      time: time,
      name: name,
      phone: phone,
      address: address,
      product: product,
      note: note,
      ip: ip
    };

    // 5. Gửi thông báo tức thì về Nhóm Telegram (dự phòng)
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      sendTelegramNotification(orderData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã lưu đơn vào sheet " + TARGET_SHEET_NAME + " thành công!"
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

/**
 * Hàm gửi tin nhắn thông báo đơn hàng tức thì vào Nhóm Telegram
 */
function sendTelegramNotification(order) {
  try {
    var token = (TELEGRAM_BOT_TOKEN || "").trim();
    var chatId = (TELEGRAM_CHAT_ID || "").trim();
    if (!token || !chatId) return;

    var rawPhone = (order.phone || "").replace(/'/g, "");
    var textMessage = "🔔 <b>BÁO ĐƠN HÀNG MỚI!</b>\n" +
                      "━━━━━━━━━━━━━━━━━━━━\n" +
                      "👤 <b>Khách hàng:</b> " + escapeHtml(order.name) + "\n" +
                      "📞 <b>Số điện thoại:</b> " + escapeHtml(rawPhone) + "\n" +
                      "📦 <b>Sản phẩm:</b> " + escapeHtml(order.product) + "\n" +
                      "🏠 <b>Địa chỉ:</b> " + escapeHtml(order.address || "Chưa cung cấp") + "\n" +
                      "📝 <b>Ghi chú:</b> " + escapeHtml(order.note || "Không có") + "\n" +
                      "🌐 <b>Địa chỉ IP:</b> " + escapeHtml(order.ip) + "\n" +
                      "⏰ <b>Thời gian đặt:</b> " + escapeHtml(order.time) + "\n" +
                      "━━━━━━━━━━━━━━━━━━━━\n" +
                      "⚡ <i>Hãy gọi xác nhận và chốt đơn ngay!</i>";

    var url = "https://api.telegram.org/bot" + token + "/sendMessage";
    var payload = {
      chat_id: chatId,
      text: textMessage,
      parse_mode: "HTML"
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(url, options);
  } catch (err) {
    Logger.log("Lỗi gửi Telegram: " + err);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
