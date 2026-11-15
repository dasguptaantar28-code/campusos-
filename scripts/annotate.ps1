Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\.user_uploaded\media_1794635341482_8eb0bcd1.png'
$outPath = 'C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\connect_guide.png'
$img = [System.Drawing.Image]::FromFile($imgPath)
$bmp = New-Object System.Drawing.Bitmap($img)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 5)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 220, 38, 38))
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)

# 1. Connect button at top:
$btnX = [int]($img.Width * 0.358)
$btnY = [int]($img.Height * 0.016)
$btnW = [int]($img.Width * 0.054)
$btnH = [int]($img.Height * 0.028)

$g.DrawRectangle($pen, $btnX, $btnY, $btnW, $btnH)
$g.FillRectangle($brush, $btnX - 10, $btnY + $btnH + 8, 340, 44)
$g.DrawString("1. Click this 'Connect' Button", $font, $whiteBrush, ($btnX), ($btnY + $btnH + 16))

# 2. Settings gear at bottom left:
$gearX = [int]($img.Width * 0.005)
$gearY = [int]($img.Height * 0.58)
$gearW = [int]($img.Width * 0.018)
$gearH = [int]($img.Height * 0.03)

$g.DrawRectangle($pen, $gearX, $gearY, $gearW, $gearH)
$g.FillRectangle($brush, $gearX + $gearW + 12, $gearY - 5, 290, 42)
$g.DrawString("2. Or click Settings (gear)", $font, $whiteBrush, ($gearX + $gearW + 20), ($gearY + 4))

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
