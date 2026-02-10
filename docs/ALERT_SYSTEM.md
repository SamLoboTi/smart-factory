# 🔔 Sistema de Pré-Alerta Preventivo

Sistema de alertas em dois níveis (Pré-Alerta → Crítico) com notificações automáticas via WhatsApp, captura de dashboard e monitoramento preventivo.

## 📋 Visão Geral

O sistema monitora continuamente os sensores e dispara alertas **antes** que falhas críticas ocorram:

- **Pré-Alerta (60-79% de risco)**: Notificação preventiva com recomendações de inspeção
- **Crítico (≥80% de risco)**: Alerta urgente com ações corretivas imediatas

## 🎯 Funcionalidades

### ✅ Detecção Inteligente
- Análise de risco via IA (Random Forest)
- Detecção de tendências anormais
- Proximidade aos limites operacionais
- Sistema de cooldown anti-spam

### 📱 Notificações WhatsApp
- Mensagens formatadas com dados do alerta
- Imagens do dashboard anexadas
- Templates diferentes para pré-alerta e crítico
- Modo simulação quando Twilio não configurado

### 📊 Captura de Dashboard
- Geração automática de imagens
- Gauge de risco visual
- Gráficos de tendência (temperatura/vibração)
- KPIs principais (OEE, MTBF, Vida Útil)

### 💾 Histórico Completo
- Todos os alertas salvos no banco
- Rastreamento de resolução
- Relatórios detalhados
- Imagens arquivadas

## 🚀 Configuração Rápida

### 1. Instalar Dependências

```bash
pip install -r requirements.txt
```

Novas dependências adicionadas:
- `twilio` - API WhatsApp
- `matplotlib` - Geração de gráficos
- `pillow` - Processamento de imagens

### 2. Configurar Credenciais Twilio

Copie o arquivo de exemplo:
```bash
copy .env.example .env
```

Edite `.env` e preencha:
```bash
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
RECIPIENT_WHATSAPP=whatsapp:+5511912040306
```

**Como obter credenciais Twilio:**
1. Crie conta em [twilio.com](https://www.twilio.com/try-twilio)
2. Acesse [Console](https://www.twilio.com/console)
3. Copie `Account SID` e `Auth Token`
4. Configure WhatsApp Sandbox em [Messaging > Try it out > Send a WhatsApp message](https://www.twilio.com/console/sms/whatsapp/sandbox)

### 3. Ajustar Thresholds (Opcional)

No arquivo `.env`:
```bash
PRE_ALERT_THRESHOLD=0.60        # 60% - Pré-alerta
CRITICAL_THRESHOLD=0.80         # 80% - Crítico
ALERT_COOLDOWN_MINUTES=15       # Cooldown entre alertas
```

### 4. Executar Simulação

```bash
python run_simulation.py
```

## 📖 Como Funciona

### Fluxo de Alerta

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Sensor envia leitura                                     │
│    ↓                                                         │
│ 2. Analytics calcula risco (IA)                             │
│    ↓                                                         │
│ 3. AlertManager verifica condições                          │
│    ├─ Risco ≥ 60%? → Pré-Alerta                            │
│    ├─ Risco ≥ 80%? → Crítico                               │
│    ├─ Tendência anormal? → Pré-Alerta                      │
│    └─ Proximidade limite? → Pré-Alerta/Crítico             │
│    ↓                                                         │
│ 4. Gera relatório detalhado                                 │
│    ↓                                                         │
│ 5. Captura dashboard (imagem)                               │
│    ↓                                                         │
│ 6. Envia WhatsApp (texto + imagem)                          │
│    ↓                                                         │
│ 7. Salva no banco de dados                                  │
└─────────────────────────────────────────────────────────────┘
```

### Condições de Disparo

**Pré-Alerta** é disparado quando:
- Risco estimado ≥ 60%
- Temperatura ≥ 85% do limite operacional
- Vibração ≥ 85% do limite operacional
- Tendência de crescimento contínuo detectada

**Crítico** é disparado quando:
- Risco estimado ≥ 80%
- Temperatura ≥ 95% do limite operacional
- Vibração ≥ 95% do limite operacional

## 📂 Arquivos Criados

```
src/
├── alert_manager.py          # Lógica de alertas
├── notification_service.py   # Integração WhatsApp
└── dashboard_capture.py      # Geração de imagens

alert_snapshots/              # Imagens geradas
├── alert_DEV-100_20260209_233000.png
└── ...

.env.example                  # Template de configuração
```

## 🧪 Modo Simulação

Se as credenciais Twilio **não** forem configuradas, o sistema funciona em **modo simulação**:

- ✅ Alertas são detectados normalmente
- ✅ Relatórios são gerados
- ✅ Imagens são capturadas
- ✅ Dados são salvos no banco
- ⚠️ Mensagens são exibidas no console (não enviadas via WhatsApp)

Ideal para desenvolvimento e testes!

## 📊 Exemplo de Mensagem

### Pré-Alerta
```
⚠️ PRÉ-ALERTA – SMART FACTORY

Status: Preventivo (antes do modo crítico)
Data/Hora: 09/02/2026 – 23:45
Equipamento: CNC Machine 1
Sensor: Temperatura / Vibração

Valores Atuais:
🌡️ Temperatura: 82.5°C
📊 Limite: 90.0°C
🔴 Proximidade: 91.7%

📳 Vibração: 4.8 mm/s
📊 Limite: 5.0 mm/s
🔴 Proximidade: 96.0%

Risco Estimado (IA): 67%

Análise:
Risco elevado: 67.0%

Recomendação:
✅ Inspeção preventiva recomendada
✅ Monitoramento reforçado nas próximas horas

📊 Relatório completo e dashboard em anexo.
```

### Crítico
```
🚨 ALERTA CRÍTICO – SMART FACTORY

Status: CRÍTICO (ação imediata necessária)
Data/Hora: 09/02/2026 – 23:50
Equipamento: CNC Machine 1

Valores Críticos:
🌡️ Temperatura: 88.2°C / 90.0°C
📳 Vibração: 5.2 / 5.0 mm/s

Risco Estimado (IA): 85%
Vida Útil Restante: 2.3 horas

AÇÃO NECESSÁRIA:
🛑 Parar equipamento imediatamente
🔧 Inspeção técnica urgente
📞 Contatar equipe de manutenção

📊 Relatório completo e dashboard em anexo.
```

## 🔧 Troubleshooting

### Erro: "Twilio não instalado"
```bash
pip install twilio
```

### Erro: "matplotlib não encontrado"
```bash
pip install matplotlib pillow
```

### WhatsApp não recebe mensagens
1. Verifique credenciais no `.env`
2. Confirme que conectou ao Sandbox Twilio
3. Envie mensagem de teste: `join <código>` para o número sandbox
4. Verifique logs do console

### Imagens não são geradas
1. Verifique se pasta `alert_snapshots/` existe
2. Confirme que matplotlib está instalado
3. Verifique permissões de escrita

## 📈 Próximos Passos

- [ ] Adicionar API REST para consultar alertas (NestJS)
- [ ] Criar componente frontend para histórico de alertas
- [ ] Implementar auto-resolução de alertas
- [ ] Adicionar notificações por email
- [ ] Dashboard em tempo real de alertas ativos

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Consulte documentação Twilio: [twilio.com/docs](https://www.twilio.com/docs)
3. Revise arquivo `.env.example`

---

**Desenvolvido para Smart Factory Project** 🏭
