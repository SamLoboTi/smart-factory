param(
    [ValidateSet("ngrok", "cloudflare")]
    [string]$Provider = $env:TUNNEL_PROVIDER,
    [int]$Port = 5174
)

$ErrorActionPreference = "Stop"

if (-not $Provider) {
    Write-Host "Defina TUNNEL_PROVIDER como 'ngrok' ou 'cloudflare'." -ForegroundColor Yellow
    exit 1
}

function Assert-Port {
    param([int]$Port)
    $listener = netstat -ano | Select-String ":$Port\s+.*LISTENING"
    if (-not $listener) {
        Write-Host "Nenhum servico escutando na porta $Port. Inicie o frontend primeiro." -ForegroundColor Red
        exit 1
    }
}

Assert-Port -Port $Port

if ($Provider -eq "ngrok") {
    if (-not $env:NGROK_DOMAIN) {
        Write-Host "Defina NGROK_DOMAIN com seu dominio reservado, exemplo: smart-factory.ngrok.app" -ForegroundColor Yellow
        exit 1
    }

    $ngrok = Get-Command ngrok.exe -ErrorAction SilentlyContinue
    if (-not $ngrok) {
        Write-Host "ngrok.exe nao encontrado no PATH. Instale ngrok e autentique com NGROK_AUTHTOKEN." -ForegroundColor Red
        exit 1
    }

    Write-Host "Abrindo tunnel estavel ngrok: https://$env:NGROK_DOMAIN" -ForegroundColor Green
    & $ngrok.Source http --domain=$env:NGROK_DOMAIN $Port
    exit $LASTEXITCODE
}

if ($Provider -eq "cloudflare") {
    if (-not $env:CLOUDFLARE_TUNNEL_NAME) {
        Write-Host "Defina CLOUDFLARE_TUNNEL_NAME com o nome do Named Tunnel." -ForegroundColor Yellow
        exit 1
    }

    $cloudflared = Get-Command cloudflared.exe -ErrorAction SilentlyContinue
    if (-not $cloudflared -and (Test-Path "C:\Users\samantha\Documents\game\tools\cloudflared.exe")) {
        $cloudflared = [pscustomobject]@{ Source = "C:\Users\samantha\Documents\game\tools\cloudflared.exe" }
    }

    if (-not $cloudflared) {
        Write-Host "cloudflared.exe nao encontrado. Instale Cloudflare Tunnel ou configure o PATH." -ForegroundColor Red
        exit 1
    }

    Write-Host "Abrindo Cloudflare Named Tunnel: $env:CLOUDFLARE_TUNNEL_NAME" -ForegroundColor Green
    & $cloudflared.Source tunnel run $env:CLOUDFLARE_TUNNEL_NAME
    exit $LASTEXITCODE
}
