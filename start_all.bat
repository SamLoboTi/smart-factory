@echo off
echo Iniciando Smart Factory (Manual Mode)...

echo [1/3] Iniciando Simulacao Python...
echo [1/3] Iniciando Simulacao Python...
python -c "import sqlite3; conn = sqlite3.connect('smart_factory.db'); conn.execute('PRAGMA journal_mode=WAL;')"
start "Python Simulation" cmd /k "python run_simulation.py"

echo [2/3] Iniciando Backend NestJS...
start "Backend API" cmd /k "cd platform && npm run start"

echo [3/3] Iniciando Frontend React...
start "Frontend Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo Aguardando servicos iniciarem (10 segundos)...
timeout /t 10 /nobreak

echo Abrindo navegador...
start http://localhost:5173

echo.
echo Todos os servicos foram iniciados!
pause
