# 🎯 Checklist de Deploy - Smart Factory

Siga esta lista para fazer o deploy completo:

## ✅ Pré-requisitos
- [x] Git instalado
- [x] Arquivos de configuração criados
- [ ] Conta no GitHub criada
- [ ] Conta no Render criada (login com GitHub)
- [ ] Conta no Vercel criada (login com GitHub)

## 📝 Passo 1: GitHub
- [ ] Acessar https://github.com/new
- [ ] Criar repositório "smart-factory"
- [ ] Copiar URL do repositório
- [ ] Executar `deploy.ps1` OU seguir comandos manuais
- [ ] Verificar que código está no GitHub

## 🚀 Passo 2: Render (Backend + Python)
- [ ] Acessar https://dashboard.render.com
- [ ] Fazer login com GitHub
- [ ] Clicar em "New +" → "Blueprint"
- [ ] Selecionar repositório "smart-factory"
- [ ] Clicar em "Apply"
- [ ] Aguardar deploy (~5-10min)
- [ ] Copiar URL da API: `https://smart-factory-api.onrender.com`
- [ ] Verificar logs: serviço rodando ✅

## 🌐 Passo 3: Vercel (Frontend)
- [ ] Acessar https://vercel.com/new
- [ ] Fazer login com GitHub
- [ ] Clicar em "Import Git Repository"
- [ ] Selecionar "smart-factory"
- [ ] Configurar:
  - Root Directory: `frontend`
  - Framework: Vite
- [ ] Adicionar variável de ambiente:
  - Nome: `VITE_API_URL`
  - Valor: URL da API do Render
- [ ] Clicar em "Deploy"
- [ ] Aguardar deploy (~2-3min)
- [ ] Copiar URL do site: `https://smart-factory-xxxx.vercel.app`

## 🔧 Passo 4: Atualizar CORS
- [ ] Editar `platform/src/main.ts`
- [ ] Adicionar URL Vercel no array `origin`
- [ ] Fazer commit: `git commit -am "Update CORS"`
- [ ] Push: `git push`
- [ ] Aguardar redeploy automático no Render

## 🧪 Passo 5: Testar
- [ ] Acessar URL do Vercel
- [ ] Dashboard carrega corretamente
- [ ] Dados em tempo real aparecem
- [ ] Gráficos funcionam
- [ ] KPIs são calculados
- [ ] Verificar logs no Render

## 📱 Passo 6: WhatsApp (Opcional)
- [ ] Obter credenciais Twilio
- [ ] No Render, ir em "smart-factory-simulation"
- [ ] Adicionar variáveis de ambiente
- [ ] Salvar e aguardar restart
- [ ] Testar alerta

## 🎉 Concluído!
- [ ] Compartilhar URL pública
- [ ] Documentar URL em README
- [ ] Configurar monitoramento (UptimeRobot)

---

**URL Final**: _______________________________

**Data de Deploy**: _______________________________
