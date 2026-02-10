# Estrutura do Projeto Smart Factory

## Visão Geral
Este documento detalha a arquitetura atual do projeto Smart Factory, seus componentes e o status de desenvolvimento.

## Componentes Principais

### 1. Plataforma (Backend API)
- **Localização**: `/platform`
- **Tecnologia**: NestJS (Node.js)
- **Responsabilidade**: Fornecer API REST para o frontend, servir dados de sensores e KPIs.
- **Conexão**: Lê dados do SQLite `smart_factory.db` via TypeORM (Entidade `SensorLeitura`).

### 2. Frontend (Dashboard)
- **Localização**: `/frontend`
- **Tecnologia**: React + Vite + Tailwind/CSS
- **Responsabilidade**: Interface do usuário, visualização de gráficos (Chart.js/Recharts).
- **Integração**: Conecta ao Backend via `services/api.ts` (Fetch API).

### 3. Core (Lógica de Negócios e Dados)
- **Localização**: `/src`
- **Tecnologia**: Python
- **Responsabilidade**:
  - **Database Manager** (`database.py`): Gerencia conexões com SQLite.
  - **Analytics** (`analytics.py`): Processamento de dados e Predição de Falhas (Classe `FailurePredictor`).
  - **Treinamento IA** (`training.py`): Script para gerar o modelo `modelo_falha.pkl`.
  - **Ingestão** (`ingestion.py`): Simulação de sensores MQTT.
  - **Assistente** (`assistant.py`): Lógica de NLP.

### 4. Legacy
- **Localização**: `/smart-factory-legacy`
- **Status**: Depreciado. Mantido apenas para backup de scripts antigos.

### 5. Banco de Dados
- **Tipo**: SQLite
- **Arquivo**: `smart_factory.db` (Raiz do projeto)
- **Tabelas Principais**:
  - `devices`: Cadastro de equipamentos.
  - `sensor_readings`: Leituras de sensores em série temporal.
  - `events`: Registro de paradas e manutenções.

---

## Onde Estamos (Status Atual)

### Concluído
- [x] **Arquitetura Híbrida**: Python (Dados) + NestJS (API) + React (UI).
- [x] **Refatoração Core**: Código Python unificado em `/src`. Pasta antiga renomeada.
- [x] **Machine Learning**: Script de treinamento (`training.py`) gera modelo real usado pelo sistema.
- [x] **Integração Real-Time**: Frontend consome dados reais da API (Sensores, KPIs, Risco).
- [x] **Banco de Dados**: SQLite totalmente operacional como hub de dados.

### Em Progresso / A Fazer
- [ ] **Inteligência do Chat**: Substituir lógica simples por LLM real ou conectar ao `assistant.py` aprimorado.
- [ ] **Predição de Falhas na API**: Expor probabilidade de falha explicitamente no endpoint de alertas.

---

## Próximos Passos Imediatos
1. **Chat Inteligente**: Implementar lógica avançada de NLP.
2. **Alertas Push**: Frontend notificar usuário visualmente quando risco for CRÍTICO.
3. **Containerização**: Criar Dockerfile para unificar os serviços.
