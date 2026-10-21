<#
    HealthNet - Start Everything
    Launches the backend and frontend. ngrok is optional.
#>

param(
    [switch]$WithNgrok
)

$ROOT = Split-Path -Parent $PSCommandPath
$BACKEND = Join-Path $ROOT 'backend'
$FRONTEND = Join-Path $ROOT 'frontend'
$NGROK = Join-Path $ROOT 'ngrok\ngrok.exe'

function Get-LanIpAddress {
    $preferred = Get-NetIPConfiguration |
        Where-Object {
            $_.IPv4DefaultGateway -ne $null -and
            $_.NetAdapter.Status -eq 'Up' -and
            $_.InterfaceAlias -notmatch 'vEthernet|Hyper-V|WSL|Virtual|Loopback'
        } |
        Select-Object -First 1

    if ($preferred -and $preferred.IPv4Address -and $preferred.IPv4Address.IPAddress) {
        return $preferred.IPv4Address.IPAddress
    }

    return Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -ne '127.0.0.1' -and
            $_.IPAddress -notlike '169.254.*' -and
            $_.InterfaceAlias -notmatch 'vEthernet|Hyper-V|WSL|Virtual|Loopback'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
}

function Start-DetachedShell {
    param(
        [string]$WorkingDirectory,
        [string]$Command
    )

    Start-Process -FilePath 'powershell.exe' -WindowStyle Minimized -ArgumentList @(
        '-NoExit',
        '-Command',
        $Command
    ) -WorkingDirectory $WorkingDirectory | Out-Null
}

Write-Host ''
Write-Host '  ============================================' -ForegroundColor Cyan
Write-Host '       HealthNet - Starting All Services' -ForegroundColor Cyan
Write-Host '  ============================================' -ForegroundColor Cyan
Write-Host ''

Write-Host '  [1/3] Starting Backend (Node/Express on port 5000)...' -ForegroundColor Yellow
Start-DetachedShell -WorkingDirectory $BACKEND -Command 'npm run start'

Write-Host '  [2/3] Starting Frontend (React on port 3000)...' -ForegroundColor Yellow
Start-DetachedShell -WorkingDirectory $FRONTEND -Command "$env:HOST='0.0.0.0'; $env:PORT='3000'; npm start"

Write-Host '  [3/3] Waiting for frontend to compile...' -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 3
    try {
        $null = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2
        $ready = $true
        break
    } catch {
        Write-Host ("        Waiting... ({0}s)" -f (($i + 1) * 3)) -ForegroundColor DarkGray
    }
}

if (-not $ready) {
    Write-Host '  [!] Frontend did not start in time. Starting ngrok anyway...' -ForegroundColor Red
}

$LAN_IP = Get-LanIpAddress
Write-Host ''
Write-Host '  ============================================' -ForegroundColor Green
Write-Host '       HealthNet - Access URLs' -ForegroundColor Green
Write-Host '  ============================================' -ForegroundColor Green
Write-Host ''
Write-Host '    Local:       http://localhost:3000' -ForegroundColor White
if ($LAN_IP) {
    Write-Host ("    LAN:         http://{0}:3000" -f $LAN_IP) -ForegroundColor White
}
if ($WithNgrok) {
    Write-Host '    ngrok:       enabled (will open tunnel after startup)' -ForegroundColor Yellow
} else {
    Write-Host '    ngrok:       disabled (run with -WithNgrok to enable)' -ForegroundColor DarkGray
}
Write-Host ''
Write-Host '  Open Local or LAN URL above to access HealthNet.' -ForegroundColor Cyan
Write-Host '  ============================================' -ForegroundColor Green
Write-Host ''
if ($WithNgrok) {
    Write-Host '  Starting ngrok tunnel...' -ForegroundColor DarkGray
    Write-Host ''

    if (Test-Path $NGROK) {
        & $NGROK http 3000
    } else {
        Write-Host ("  [!] ngrok executable not found at: {0}" -f $NGROK) -ForegroundColor Red
        Write-Host '  Start ngrok manually or place ngrok.exe in the ngrok folder.' -ForegroundColor Yellow
    }
}
