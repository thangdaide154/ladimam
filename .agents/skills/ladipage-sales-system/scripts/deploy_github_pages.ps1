<#
.SYNOPSIS
    Script tự động kích hoạt GitHub Pages và cấu hình tên miền riêng (Subdomain) kèm HTTPS SSL.
.DESCRIPTION
    Sử dụng GitHub REST API để:
    1. Kích hoạt GitHub Pages nhánh main / root.
    2. Cấu hình CNAME subdomain (ví dụ: deal.rexin.vn).
    3. Kiểm tra và kích hoạt bắt buộc HTTPS.
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,

    [Parameter(Mandatory=$true)]
    [string]$RepoOwner,

    [Parameter(Mandatory=$true)]
    [string]$RepoName,

    [Parameter(Mandatory=$false)]
    [string]$CustomDomain
)

$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept"        = "application/vnd.github.v3+json"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 TRIỂN KHAI GITHUB PAGES TỰ ĐỘNG" -ForegroundColor Cyan
Write-Host "Repo: $RepoOwner/$RepoName" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Kích hoạt Pages
$pagesUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/pages"
try {
    $existing = Invoke-RestMethod -Uri $pagesUrl -Headers $headers -Method Get
    Write-Host "✓ GitHub Pages đã được kích hoạt từ trước: $($existing.html_url)" -ForegroundColor Green
} catch {
    Write-Host "Đang kích hoạt GitHub Pages mới..." -ForegroundColor Yellow
    $bodyEnable = @{
        source = @{
            branch = "main"
            path   = "/"
        }
    } | ConvertTo-Json
    $newPages = Invoke-RestMethod -Uri $pagesUrl -Headers $headers -Method Post -Body $bodyEnable -ContentType "application/json"
    Write-Host "✓ Đã kích hoạt GitHub Pages thành công: $($newPages.html_url)" -ForegroundColor Green
}

# 2. Cấu hình Tên miền riêng (CNAME) nếu có
if ($CustomDomain) {
    Write-Host "`nĐang liên kết tên miền riêng: $CustomDomain..." -ForegroundColor Yellow
    $bodyCname = @{
        cname = $CustomDomain
    } | ConvertTo-Json
    Invoke-RestMethod -Uri $pagesUrl -Headers $headers -Method Put -Body $bodyCname -ContentType "application/json" | Out-Null
    Write-Host "✓ Đã gắn CNAME $CustomDomain vào GitHub Pages!" -ForegroundColor Green

    # Kiểm tra trạng thái SSL
    Start-Sleep -Seconds 3
    $status = Invoke-RestMethod -Uri $pagesUrl -Headers $headers -Method Get
    Write-Host "Trạng thái chứng chỉ SSL: $($status.https_certificate.state) ($($status.https_certificate.description))" -ForegroundColor Cyan

    # Cố gắng bật Enforce HTTPS
    try {
        $bodyHttps = @{
            cname          = $CustomDomain
            https_enforced = $true
        } | ConvertTo-Json
        Invoke-RestMethod -Uri $pagesUrl -Headers $headers -Method Put -Body $bodyHttps -ContentType "application/json" | Out-Null
        Write-Host "✓ Đã bật Enforce HTTPS bảo mật thành công!" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ Chứng chỉ SSL đang trong quá trình cấp phát tự động (Let's Encrypt). Hãy đợi vài phút để hoàn tất." -ForegroundColor Yellow
    }
}
