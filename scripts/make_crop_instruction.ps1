Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\.user_uploaded\media_1794635957467_61bd8dd8.png'
$outPath = 'C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\crop_copy_instruction.png'
$img = [System.Drawing.Image]::FromFile($imgPath)
$bmp = New-Object System.Drawing.Bitmap($img)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 239, 68, 68), 5)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 220, 38, 38))
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)

# Box coordinates: x is around 0.70 to 0.98, y is around 0.65 to 0.85
$boxX = [int]($img.Width * 0.73)
$boxY = [int]($img.Height * 0.67)
$boxW = [int]($img.Width * 0.25)
$boxH = [int]($img.Height * 0.16)

$g.DrawRectangle($pen, $boxX, $boxY, $boxW, $boxH)
$g.FillRectangle($brush, $boxX - 20, $boxY - 50, 480, 44)
$g.DrawString("Copy these 2 lines & paste in chat!", $font, $whiteBrush, ($boxX - 10), ($boxY - 42))

# Now let us crop just this region + surroundings
$cropX = [Math]::Max(0, [int]($img.Width * 0.50))
$cropY = [int]($img.Height * 0.45)
$cropW = [int]($img.Width * 0.49)
$cropH = [int]($img.Height * 0.45)

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$crop = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
$gCrop = [System.Drawing.Graphics]::FromImage($crop)
$gCrop.DrawImage($bmp, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)

$crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$gCrop.Dispose()
$crop.Dispose()
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Output "Created crop_copy_instruction.png"
