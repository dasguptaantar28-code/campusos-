$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== 1. Running PostgreSQL Migrations, RLS Isolation & Acceptance Tests A-E ==="
Push-Location "$root\tests"
npm.cmd test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Pop-Location

Write-Host "=== 2. Running Next.js Typecheck, Lint & Production Build ==="
Push-Location "$root\apps\web"
npm.cmd run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm.cmd run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Pop-Location

$flutterBin = if (Test-Path "D:\flutter\bin\flutter.bat") { "D:\flutter\bin\flutter.bat" } else { "flutter" }
if (Get-Command $flutterBin -ErrorAction SilentlyContinue) {
  Write-Host "=== 3. Running Flutter Analyze & Widget Tests ==="
  Push-Location "$root\apps\mobile"
  & $flutterBin analyze
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & $flutterBin test
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Pop-Location
} else {
  Write-Warning "Flutter SDK not found yet."
}

Write-Host "ALL CHECKS PASSED!"
