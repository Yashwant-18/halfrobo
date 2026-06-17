# ╔══════════════════════════════════════════════════╗
# ║        HalfRobo — Start Script                   ║
# ║  Runs backend (port 5000) + frontend (port 5173) ║
# ╚══════════════════════════════════════════════════╝

Write-Host ""
Write-Host "  ██╗  ██╗ █████╗ ██╗     ███████╗██████╗  ██████╗ ██████╗  ██████╗ " -ForegroundColor Cyan
Write-Host "  ██║  ██║██╔══██╗██║     ██╔════╝██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗" -ForegroundColor Cyan
Write-Host "  ███████║███████║██║     █████╗  ██████╔╝██║   ██║██████╔╝██║   ██║" -ForegroundColor Cyan
Write-Host "  ██╔══██║██╔══██║██║     ██╔══╝  ██╔══██╗██║   ██║██╔══██╗██║   ██║" -ForegroundColor Cyan
Write-Host "  ██║  ██║██║  ██║███████╗██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝" -ForegroundColor Cyan
Write-Host "  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝ " -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Kill any existing processes on ports 5000 and 5173 ──────────
Write-Host "  [1/4] Clearing ports..." -ForegroundColor Yellow

$ports = @(5000, 5173)
foreach ($port in $ports) {
    $connections = netstat -ano 2>$null | Select-String ":$port\s"
    foreach ($conn in $connections) {
        $parts = $conn.ToString().Trim() -split '\s+'
        $procId = $parts[-1]
        if ($procId -match '^\d+$' -and $procId -ne '0') {
            taskkill /F /PID $procId 2>$null | Out-Null
        }
    }
}
Start-Sleep -Seconds 1
Write-Host "  ✅ Ports cleared (5000, 5173)" -ForegroundColor Green

# ── Step 2: Check .env exists ────────────────────────────────────────────
Write-Host "  [2/4] Checking environment..." -ForegroundColor Yellow

$envPath = Join-Path $PSScriptRoot "server\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "  ⚠️  server\.env not found!" -ForegroundColor Red
    Write-Host "      Copy server\.env.example to server\.env and fill in your DATABASE_URL" -ForegroundColor Red
    Write-Host "      Then run this script again." -ForegroundColor Red
    Read-Host "  Press Enter to exit"
    exit 1
}
Write-Host "  ✅ Environment file found" -ForegroundColor Green

# ── Step 3: Start backend ─────────────────────────────────────────────────
Write-Host "  [3/4] Starting backend (port 5000)..." -ForegroundColor Yellow

$serverPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    `$Host.UI.RawUI.WindowTitle = 'HalfRobo Backend :5000';
    `$Host.UI.RawUI.BackgroundColor = 'DarkBlue';
    Clear-Host;
    Write-Host '  🚀 HalfRobo Backend' -ForegroundColor Cyan;
    Write-Host '  Running on http://localhost:5000' -ForegroundColor Green;
    Write-Host '';
    Set-Location '$serverPath';
    node server.js
" -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Step 4: Start frontend ────────────────────────────────────────────────
Write-Host "  [4/4] Starting frontend (port 5173)..." -ForegroundColor Yellow

$clientPath = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    `$Host.UI.RawUI.WindowTitle = 'HalfRobo Frontend :5173';
    `$Host.UI.RawUI.BackgroundColor = 'DarkMagenta';
    Clear-Host;
    Write-Host '  🌐 HalfRobo Frontend' -ForegroundColor Cyan;
    Write-Host '  Running on http://localhost:5173' -ForegroundColor Green;
    Write-Host '';
    Set-Location '$clientPath';
    npm run dev
" -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Done ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎉 HalfRobo is starting up!" -ForegroundColor Green
Write-Host "  ════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌐 Store:       http://localhost:5173" -ForegroundColor White
Write-Host "  👑 Admin:       http://localhost:5173/admin/login" -ForegroundColor White
Write-Host "  ⚙️  API:         http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "  🔑 Admin Login: admin@halfrobo.com / admin123" -ForegroundColor DarkGray
Write-Host "  👤 User Login:  demo@halfrobo.com  / demo123" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Two new terminal windows have opened." -ForegroundColor Yellow
Write-Host "  Open http://localhost:5173 in your browser!" -ForegroundColor Yellow
Write-Host ""

# Auto-open browser after 4 seconds
Start-Sleep -Seconds 4
Start-Process "http://localhost:5173"
