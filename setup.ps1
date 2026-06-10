# HalfRobo Quick Setup Script (Windows PowerShell)
# Run this script once after cloning/downloading the project

Write-Host "`n🤖 HalfRobo Setup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "`n✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Node.js not found! Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install server dependencies
Write-Host "`n📦 Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Server npm install failed" -ForegroundColor Red; exit 1 }
Write-Host "✅ Server dependencies installed" -ForegroundColor Green

# Install client dependencies
Write-Host "`n📦 Installing client dependencies..." -ForegroundColor Yellow
Set-Location ../client
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Client npm install failed" -ForegroundColor Red; exit 1 }
Write-Host "✅ Client dependencies installed" -ForegroundColor Green

Set-Location ..

Write-Host "`n✅ Dependencies installed!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Install PostgreSQL from https://www.postgresql.org/download/windows/"
Write-Host "  2. Create database: psql -U postgres -c 'CREATE DATABASE halfrobo;'"
Write-Host "  3. Update server/.env with your PostgreSQL password"
Write-Host "  4. Seed database: cd server && npm run seed"
Write-Host "  5. Start servers:"
Write-Host "     Terminal 1: cd server && npm run dev"
Write-Host "     Terminal 2: cd client && npm run dev"
Write-Host "`n🌐 Then open: http://localhost:5173"
Write-Host "🔐 Admin panel: http://localhost:5173/admin/login"
Write-Host "   Credentials: admin@halfrobo.com / admin123`n"
