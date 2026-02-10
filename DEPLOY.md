# 🚀 Guia de Deploy - Smart Factory

## Passo a Passo para Hospedar Online (Gratuito)

---

## ✅ Pré-requisitos

Antes de começar, você precisa:

1. **Conta no GitHub** - [github.com](https://github.com)
2. **Conta no Render** - [render.com](https://render.com) (login com GitHub)
3. **Conta no Vercel** - [vercel.com](https://vercel.com) (login com GitHub)
4. **Git instalado** - Verifique com `git --version`

---

## 📝 Passo 1: Criar Repositório no GitHub

### 1.1 Criar Repositório

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `smart-factory`
3. Descrição: "Sistema de monitoramento industrial inteligente com IA"
4. **Deixe PRIVADO** (ou público se preferir)
5. **NÃO** marque "Add README" (já temos)
6. Clique em "Create repository"

### 1.2 Inicializar Git Local

Abra o terminal no diretório do projeto e execute:

```bash
cd c:\Users\samantha\Documents\PROJETO_FABRIC_SMART

# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Initial commit - Smart Factory with Alert System"

# Renomear branch para main
git branch -M main

# Adicionar remote (SUBSTITUA seu-usuario pelo seu username do GitHub)
git remote add origin https://github.com/seu-usuario/smart-factory.git

# Fazer push
git push -u origin main
```

**Importante**: Substitua `seu-usuario` pelo seu username real do GitHub!

---

## 📝 Passo 2: Deploy do Backend e Python (Render)

### 2.1 Conectar Render ao GitHub

1. Acesse [render.com/dashboard](https://dashboard.render.com)
2. Clique em "New +" → "Blueprint"
3. Conecte sua conta GitHub (se ainda não conectou)
4. Autorize o Render a acessar seus repositórios

### 2.2 Deploy via Blueprint

1. Selecione o repositório `smart-factory`
2. O Render detectará automaticamente o arquivo `render.yaml`
3. Revise os serviços que serão criados:
   - `smart-factory-api` (Web Service)
   - `smart-factory-simulation` (Worker)
4. Clique em "Apply"

### 2.3 Configurar Variáveis de Ambiente (Opcional)

Se quiser ativar notificações WhatsApp:

1. Vá em cada serviço → "Environment"
2. Adicione as variáveis:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   RECIPIENT_WHATSAPP=whatsapp:+5511912040306
   ```
3. Clique em "Save Changes"

### 2.4 Aguardar Deploy

- O deploy leva ~5-10 minutos
- Acompanhe os logs em tempo real
- Quando aparecer "Live", está pronto! ✅

### 2.5 Anotar URL da API

Copie a URL do serviço `smart-factory-api`:
```
https://smart-factory-api.onrender.com
```

---

## 📝 Passo 3: Deploy do Frontend (Vercel)

### 3.1 Instalar Vercel CLI (Opcional)

```bash
npm install -g vercel
```

### 3.2 Deploy via Dashboard (Recomendado)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em "Import Git Repository"
3. Selecione `smart-factory`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   ```
   VITE_API_URL=https://smart-factory-api.onrender.com
   ```
   (Use a URL que você anotou no Passo 2.5)
6. Clique em "Deploy"

### 3.3 Aguardar Deploy

- Deploy leva ~2-3 minutos
- Quando concluir, você receberá uma URL:
  ```
  https://smart-factory-xxxx.vercel.app
  ```

---

## 📝 Passo 4: Atualizar CORS no Backend

### 4.1 Atualizar URL no Código

Edite `platform/src/main.ts` e adicione sua URL Vercel:

```typescript
origin: [
  'http://localhost:5173',
  'https://smart-factory.vercel.app',
  'https://smart-factory-xxxx.vercel.app', // Sua URL real
],
```

### 4.2 Fazer Commit e Push

```bash
git add platform/src/main.ts
git commit -m "Update CORS for production URL"
git push
```

O Render fará redeploy automático! 🎉

---

## 📝 Passo 5: Testar Sistema Online

### 5.1 Acessar Dashboard

Abra no navegador:
```
https://smart-factory-xxxx.vercel.app
```

### 5.2 Verificar Funcionalidades

- ✅ Dashboard carrega
- ✅ Dados em tempo real aparecem
- ✅ Gráficos atualizam
- ✅ KPIs são calculados
- ✅ Alertas aparecem (se houver risco)

### 5.3 Verificar Logs do Backend

No Render dashboard:
1. Acesse `smart-factory-simulation`
2. Vá em "Logs"
3. Verifique se está gerando dados:
   ```
   🔔 Sistema de Alertas Preventivos Ativado
   [timestamp] Recebido: {'device_id': 'DEV-100', ...}
   ```

---

## 🎯 URLs Finais

Após o deploy, você terá:

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | https://smart-factory-xxxx.vercel.app | Público |
| **API Backend** | https://smart-factory-api.onrender.com | Público |
| **Python Worker** | (background) | Rodando |

---

## 🔧 Manutenção e Atualizações

### Fazer Deploy de Mudanças

```bash
# Fazer alterações no código
git add .
git commit -m "Descrição da mudança"
git push

# Deploy automático acontece em:
# - Render: ~5min
# - Vercel: ~2min
```

### Ver Logs em Tempo Real

**Render**:
1. Dashboard → Selecionar serviço → "Logs"

**Vercel**:
1. Dashboard → Selecionar deployment → "Functions" → Ver logs

---

## ⚠️ Limitações do Plano Gratuito

### Render Free Tier

- **Serviços dormem** após 15min de inatividade
- **Cold start** de ~30s na primeira requisição
- **750 horas/mês** de runtime total

**Solução**: Usar [UptimeRobot](https://uptimerobot.com) para fazer ping a cada 5min

### Vercel Hobby

- **100GB bandwidth/mês**
- **100 deployments/dia**
- Mais que suficiente para demonstração

---

## 🐛 Troubleshooting

### Frontend não carrega dados

1. Verifique se `VITE_API_URL` está configurado corretamente
2. Abra DevTools (F12) → Console → Veja erros
3. Verifique CORS no backend

### Backend retorna 404

1. Verifique se o deploy do Render terminou
2. Acesse a URL da API diretamente
3. Veja logs no Render dashboard

### Python Worker não está gerando dados

1. Vá em Render → `smart-factory-simulation` → "Logs"
2. Verifique se há erros
3. Confirme que `requirements.txt` está correto

### Alertas WhatsApp não funcionam

1. Verifique variáveis de ambiente no Render
2. Confirme credenciais Twilio
3. Veja logs do Python worker

---

## 📊 Monitoramento

### Render Dashboard

- Ver uptime dos serviços
- Monitorar uso de recursos
- Ver logs em tempo real

### Vercel Analytics

- Ver número de visitantes
- Tempo de carregamento
- Erros do frontend

---

## 🎉 Pronto!

Seu Smart Factory está online e acessível para qualquer pessoa! 🚀

**Compartilhe a URL**:
```
https://smart-factory-xxxx.vercel.app
```

---

## 📞 Suporte

Se tiver problemas:

1. Verifique logs no Render e Vercel
2. Revise este guia
3. Consulte documentação:
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
