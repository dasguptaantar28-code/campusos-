Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\.user_uploaded\media_1794635957467_61bd8dd8.png'
$outPath = 'C:\Users\This PC\Desktop\campusos\crop_keys.png'
$img = [System.Drawing.Image]::FromFile($imgPath)

# Let's crop the bottom right area where the code block is
# roughly x=700 to 1000, y=600 to 800 in 1920x1080 (or x = 0.70 to 1.0 of width, y = 0.65 to 0.85 of height)
$x = [int]($img.Width * 0.72)
$y = [int]($img.Height * 0.68)
$w = [int]($img.Width * 0.27)
$h = [int]($img.Height * 0.20)

$rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
$crop = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$crop.Dispose()
$img.Dispose()
Write-Output "Cropped keys box"
