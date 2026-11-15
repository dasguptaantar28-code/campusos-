Add-Type -AssemblyName System.Drawing
$inPath = "C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\.user_uploaded\media_1794634805195_ea00ea4f.png"
$outPath = "C:\Users\This PC\Desktop\campusos\url_zoomed.png"
$img = [System.Drawing.Image]::FromFile($inPath)
# The browser address bar is roughly around x=100, y=10 to x=600, y=50
$rect = New-Object System.Drawing.Rectangle(100, 10, 500, 40)
$crop = New-Object System.Drawing.Bitmap(500, 40)
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$crop.Dispose()
$img.Dispose()
Write-Output "Saved url_zoomed.png"
