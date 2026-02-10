# Script de Deploy - Smart Factory
# Execute este script após criar o repositório no GitHub

Write-Host "🚀 Smart Factory - Inicializando Deploy" -ForegroundColor Cyan
Write-Host ""

# Verificar se Git está disponível
try {
    git --version | Out-Null
    Write-Host "✅ Git encontrado" -ForegroundColor Green
}
catch {
    Write-Host "❌ Git não encontrado. Por favor, reinicie o terminal." -ForegroundColor Red
    Write-Host "Pressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""
Write-Host "📝 IMPORTANTE: Antes de continuar, você precisa:" -ForegroundColor Yellow
Write-Host "1. Criar um repositório no GitHub (https://github.com/new)" -ForegroundColor Yellow
Write-Host "2. Nome sugerido: smart-factory" -ForegroundColor Yellow
Write-Host "3. Copiar a URL do repositório" -ForegroundColor Yellow
Write-Host ""

# Solicitar URL do repositório
$repoUrl = Read-Host "Cole a URL do seu repositório GitHub (ex: https://github.com/usuario/smart-factory.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ URL não fornecida. Abortando." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Configurando Git..." -ForegroundColor Cyan

# Configurar Git
$userName = Read-Host "Seu nome (para commits)"
$userEmail = Read-Host "Seu email (para commits)"

git config user.name "$userName"
git config user.email "$userEmail"

Write-Host "✅ Git configurado" -ForegroundColor Green
Write-Host ""

# Inicializar repositório
Write-Host "📦 Inicializando repositório..." -ForegroundColor Cyan

if (Test-Path ".git") {
    Write-Host "⚠️  Repositório Git já existe. Pulando init..." -ForegroundColor Yellow
}
else {
    git init
    Write-Host "✅ Repositório inicializado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📁 Adicionando arquivos..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "💾 Criando commit..." -ForegroundColor Cyan
git commit -m "Initial commit - Smart Factory with Alert System"

Write-Host ""
Write-Host "🌿 Configurando branch main..." -ForegroundColor Cyan
git branch -M main

Write-Host ""
Write-Host "🔗 Conectando ao GitHub..." -ForegroundColor Cyan
git remote add origin $repoUrl

Write-Host ""
Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Cyan
Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "✅ SUCESSO! Código enviado para GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Deploy no Render: https://dashboard.render.com" -ForegroundColor White
Write-Host "   - New + → Blueprint" -ForegroundColor Gray
Write-Host "   - Selecione seu repositório" -ForegroundColor Gray
Write-Host "   - Aguarde deploy (~5-10min)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy no Vercel: https://vercel.com/new" -ForegroundColor White
Write-Host "   - Import Git Repository" -ForegroundColor Gray
Write-Host "   - Root Directory: frontend" -ForegroundColor Gray
Write-Host "   - Adicione variável: VITE_API_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Veja o guia completo em: DEPLOY.md" -ForegroundColor White
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
