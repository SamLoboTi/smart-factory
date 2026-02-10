@echo off
echo ========================================
echo  Smart Factory - Git Setup
echo ========================================
echo.

REM Verificar se Git está disponível
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Git nao encontrado!
    echo.
    echo Por favor:
    echo 1. Feche este terminal
    echo 2. Abra um NOVO PowerShell
    echo 3. Execute novamente este script
    echo.
    pause
    exit /b 1
)

echo [OK] Git encontrado!
echo.

REM Configurar Git
echo Configurando Git...
git config user.name "Samantha"
git config user.email "samantha@smartfactory.com"
echo [OK] Git configurado
echo.

REM Inicializar repositório
echo Inicializando repositorio...
if exist ".git" (
    echo [AVISO] Repositorio Git ja existe
) else (
    git init
    echo [OK] Repositorio inicializado
)
echo.

REM Adicionar arquivos
echo Adicionando arquivos...
git add .
echo [OK] Arquivos adicionados
echo.

REM Commit
echo Criando commit...
git commit -m "Initial commit - Smart Factory with Alert System"
if %ERRORLEVEL% EQU 0 (
    echo [OK] Commit criado
) else (
    echo [AVISO] Nada para commitar ou commit ja existe
)
echo.

REM Branch
echo Configurando branch main...
git branch -M main
echo [OK] Branch configurada
echo.

REM Remote
echo Adicionando remote...
git remote remove origin 2>nul
git remote add origin https://github.com/SamLoboTi/smart-factory.git
echo [OK] Remote adicionado
echo.

REM Push
echo ========================================
echo  Fazendo upload para GitHub...
echo  Isso pode levar alguns minutos...
echo ========================================
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCESSO! Codigo enviado para GitHub!
    echo ========================================
    echo.
    echo Repositorio: https://github.com/SamLoboTi/smart-factory
    echo.
    echo Proximos passos:
    echo 1. Deploy no Render: https://dashboard.render.com
    echo 2. Deploy no Vercel: https://vercel.com/new
    echo.
    echo Veja DEPLOY.md para instrucoes completas
    echo.
) else (
    echo.
    echo [ERRO] Falha no push!
    echo.
    echo Possiveis causas:
    echo - Repositorio nao existe no GitHub
    echo - Sem permissao de acesso
    echo - Problemas de rede
    echo.
    echo Verifique e tente novamente
    echo.
)

pause
