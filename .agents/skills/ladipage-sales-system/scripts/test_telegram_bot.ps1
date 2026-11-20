<#
.SYNOPSIS
    Script chẩn đoán và kiểm tra Telegram Bot & Nhóm Telegram nhận đơn hàng.
.DESCRIPTION
    1. Kiểm tra Token bot Telegram.
    2. Tự động đọc Chat ID của nhóm Telegram từ tin nhắn gần nhất.
    3. Gửi tin nhắn thử nghiệm vào nhóm.
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$BotToken,

    [Parameter(Mandatory=$false)]
    [string]$ChatId
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔍 KIỂM TRA BOT TELEGRAM" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Kiểm tra Bot Token
try {
    $me = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/getMe" -Method Get
    if ($me.ok) {
        Write-Host "✓ Bot hợp lệ: $($me.result.first_name) (@$($me.result.username))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Bot Token không hợp lệ hoặc bị lỗi mạng!" -ForegroundColor Red
    exit 1
}

# 2. Tìm Chat ID nếu chưa có
if (-not $ChatId) {
    Write-Host "`nĐang tìm Chat ID từ lịch sử tin nhắn của Bot..." -ForegroundColor Yellow
    $updates = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/getUpdates" -Method Get
    
    $groupMsg = $updates.result | Where-Object { $_.message.chat.type -in @("group", "supergroup") } | Select-Object -Last 1
    if ($groupMsg) {
        $ChatId = $groupMsg.message.chat.id
        $groupTitle = $groupMsg.message.chat.title
        Write-Host "✓ Đã tìm thấy nhóm: $groupTitle (Chat ID: $ChatId)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Chưa tìm thấy tin nhắn nhóm!" -ForegroundColor Yellow
        Write-Host "👉 Hãy thêm bot vào nhóm, cấp quyền Admin và gõ /test vào nhóm rồi chạy lại script này!" -ForegroundColor Yellow
        exit 1
    }
}

# 3. Gửi tin nhắn thử nghiệm
Write-Host "`nĐang gửi tin nhắn thử nghiệm vào nhóm $ChatId..." -ForegroundColor Yellow
$testText = @"
🔔 <b>BÁO ĐƠN HÀNG THỬ NGHIỆM!</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Khách hàng:</b> Nguyễn Văn A
📞 <b>Số điện thoại:</b> 0988888888
📦 <b>Sản phẩm:</b> Sản Phẩm Mẫu (990.000đ)
🏠 <b>Địa chỉ:</b> Hà Nội
🌐 <b>Địa chỉ IP:</b> 127.0.0.1
⏰ <b>Thời gian:</b> $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
━━━━━━━━━━━━━━━━━━━━
⚡ <i>Kết nối thành công 100%!</i>
"@

$body = @{
    chat_id = $ChatId
    text = $testText
    parse_mode = "HTML"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "https://api.telegram.org/bot$BotToken/sendMessage" -Method Post -Body $body -ContentType "application/json; charset=utf-8"
    if ($res.ok) {
        Write-Host "🎉 GỬI THÀNH CÔNG! Hãy kiểm tra nhóm Telegram của bạn." -ForegroundColor Green
        Write-Host "👉 Hãy dùng thông số này trong code Landing Page:" -ForegroundColor Cyan
        Write-Host "   TELEGRAM_BOT_TOKEN = `"$BotToken`"" -ForegroundColor White
        Write-Host "   TELEGRAM_CHAT_ID   = `"$ChatId`"" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Lỗi khi gửi tin nhắn: $($_.Exception.Message)" -ForegroundColor Red
}
