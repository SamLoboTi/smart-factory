Write-Host "Iniciando Smart Factory (PowerShell Mode)..." -ForegroundColor Cyan

# 1. Simulação Python
Write-Host "[1/3] Iniciando Simulacao Python..."
Start-Process cmd -ArgumentList "/k set DATABASE_PATH=data\smart_factory.db && python run_simulation.py" -WorkingDirectory $PSScriptRoot

# 2. Backend NestJS
Write-Host "[2/3] Iniciando Backend NestJS..."
Start-Process cmd -ArgumentList "/k cd platform && set DATABASE_PATH=..\data\smart_factory.db && npm run start" -WorkingDirectory $PSScriptRoot

# 3. Frontend React
Write-Host "[3/3] Iniciando Frontend React..."
Start-Process cmd -ArgumentList "/k cd frontend && npm run dev" -WorkingDirectory $PSScriptRoot

Write-Host "Aguardando servicos iniciarem (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Abrindo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "Pronto! Janelas abertas."
