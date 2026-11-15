Add-Type -AssemblyName System.Drawing
$inPath = "C:\Users\This PC\.gemini\antigravity\brain\187c0c2e-7d7f-4f1d-a87e-2d1ba95c3c15\.user_uploaded\media_1794634805195_ea00ea4f.png"
$outPath = "C:\Users\This PC\Desktop\campusos\url_zoomed_2.png"
$img = [System.Drawing.Image]::FromFile($inPath)
# The full address bar
$rect = New-Object System.Drawing.Rectangle(120, 0, 400, 30)
$crop = New-Object System.Drawing.Bitmap(400, 30)
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$crop.Dispose()
$img.Dispose()
Write-Output "Saved url_zoomed_2.png"
