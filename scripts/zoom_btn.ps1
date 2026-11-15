Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\connect_guide.png'
$outPath = 'C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\connect_button_zoom.png'
$img = [System.Drawing.Image]::FromFile($imgPath)
$rect = New-Object System.Drawing.Rectangle([int]($img.Width * 0.30), 0, [int]($img.Width * 0.35), [int]($img.Height * 0.15))
$crop = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$crop.Dispose()
$img.Dispose()
