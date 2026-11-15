Add-Type -AssemblyName System.Windows.Forms
$path = 'C:\Users\This PC\Desktop\campusos\supabase\super_admin_setup.sql'
$sql = [System.IO.File]::ReadAllText($path)
for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
        [System.Windows.Forms.Clipboard]::SetText($sql)
        Write-Output "Clipboard successfully set with super_admin_setup.sql!"
        break
    } catch {
        Start-Sleep -Milliseconds 250
    }
}
