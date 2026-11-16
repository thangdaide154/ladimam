/**
 * ===================================================================
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG ĐỔ ĐƠN VÀO SHEET "mamtron"
 * & BẮN THÔNG BÁO TỨC THÌ VỀ NHÓM TELEGRAM / ZALO
 * Bảng gồm 7 cột: Thời Gian Đặt | Họ Tên | SĐT | Địa Chỉ | Sản Phẩm | Ghi Chú | Địa Chỉ IP
 * ===================================================================
 */

// ===================================================================
// 1. CẤU HÌNH NHÓM TELEGRAM (ĐÃ CẤU HÌNH SẴN CHO BẠN)
// ===================================================================
var TELEGRAM_BOT_TOKEN = "8947219302:AAFAFKlSny3vr99dtVGKUlE5iu60eplNliA"; // Bot Ladidz (@Ladidz_bot)
var TELEGRAM_CHAT_ID = "-5440398762"; // Nhóm "Test ladi"

// ===================================================================
// 2. CẤU HÌNH WEBHOOK NHÓM ZALO (TÙY CHỌN NẾU CÓ)
// ===================================================================
var ZALO_WEBHOOK_URL = ""; 

/**
 * ===================================================================
 * ⭐️ HÀM TEST VÀ CẤP QUYỀN TRUY CẬP (BẮT BUỘC CHẠY 1 LẦN TRÊN APPS SCRIPT)
 * 1. Chọn hàm 'testTelegram' ở thanh dropdown bên trên.
 * 2. Bấm nút 'Chạy' (Run).
 * 3. Bấm "Xem lại quyền" -> Chọn tài khoản Google -> Nâng cao -> Đi tới (không an toàn) -> Cho phép.
 * ===================================================================
 */
function testTelegram() {
  var testOrder = {
    name: "Khách Mua Thử Nghiệm",
    phone: "0988888888",
    product: "Mâm xoay 80cm - 1.250.000đ",
    address: "Hà Nội",
    note: "Đơn test thử nghiệm kết nối",
    ip: "127.0.0.1",
    time: Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss")
  };
  sendTelegramNotification(testOrder);
}

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

    var orderData = {
      time: time,
      name: name,
      phone: phone,
      address: address,
      product: product,
      note: note,
      ip: ip
    };

    // 5. Tự động gửi thông báo tức thì về Nhóm Telegram
    sendTelegramNotification(orderData);

    // 6. Tự động gửi thông báo về Nhóm Zalo (nếu có cài Webhook)
    var targetZaloWebhook = (p.zalo_webhook || ZALO_WEBHOOK_URL || "").trim();
    if (targetZaloWebhook && targetZaloWebhook.startsWith("http")) {
      sendZaloNotification(orderData, targetZaloWebhook);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã lưu đơn vào sheet mamtron và gửi thông báo thành công!"
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
    var textMessage = "🔔 <b>BÁO ĐƠN MÂM XOAY ROWANTO MỚI!</b>\n" +
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

    var res = UrlFetchApp.fetch(url, options);
    Logger.log("Telegram Response: " + res.getContentText());
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

/**
 * Hàm gửi tin nhắn thông báo đơn hàng vào Nhóm Zalo qua Webhook
 */
function sendZaloNotification(order, webhookUrl) {
  try {
    var rawPhone = (order.phone || "").replace(/'/g, "");
    var textMessage = "🔔 BÁO ĐƠN MÂM XOAY ROWANTO MỚI!\n" +
                      "━━━━━━━━━━━━━━━━━━━\n" +
                      "👤 Khách hàng: " + order.name + "\n" +
                      "📞 Số điện thoại: " + rawPhone + "\n" +
                      "📦 Sản phẩm: " + order.product + "\n" +
                      "🏠 Địa chỉ: " + (order.address || "Chưa cung cấp") + "\n" +
                      "📝 Ghi chú: " + (order.note || "Không có") + "\n" +
                      "🌐 Địa chỉ IP: " + order.ip + "\n" +
                      "⏰ Thời gian đặt: " + order.time + "\n" +
                      "━━━━━━━━━━━━━━━━━━━\n" +
                      "⚡ Hãy gọi điện xác nhận và chốt đơn ngay!";

    var payload = JSON.stringify({
      message: textMessage,
      content: textMessage,
      text: textMessage,
      customer_name: order.name,
      customer_phone: rawPhone,
      product: order.product,
      address: order.address,
      ip: order.ip,
      data: order
    });

    var options = {
      method: "post",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(webhookUrl, options);
  } catch (err) {
    Logger.log("Lỗi gửi Webhook Zalo: " + err);
  }
}
