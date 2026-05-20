# Smart Factory Project 🏭

Sistema de monitoramento industrial inteligente com arquitetura híbrida (Python + NestJS + React).

## 🚀 Funcionalidades

- **Monitoramento em Tempo Real**: Leitura de sensores (Vibração, Temperatura, Pressão) via dashboard interativo.
- **Predição de Falhas (AI/ML)**: Modelo Random Forest treinado capaz de prever riscos de equipamentos baseados em dados históricos.
- **Sistema de Pré-Alerta Preventivo** ⚠️ **NOVO!**: 
  - Alertas em dois níveis (Pré-Alerta 60% → Crítico 80%)
  - Notificações automáticas via WhatsApp
  - Captura de dashboard com gráficos e KPIs
  - Detecção de tendências anormais antes de falhas críticas
- **Chat Inteligente**: Assistente virtual capaz de responder sobre o status da planta e delegar processamento complexo para o Python.
- **Alertas Visuais**: Sistema de notificação (Toast) para eventos críticos e alta probabilidade de falha.
- **Deploy Simplificado**: Containerização completa com Docker.

## 🏗️ Arquitetura

O projeto é dividido em 3 camadas principais:

1.  **Core (Python)**:
    - Simula sensores IoT via MQTT.
    - Processa dados e salva no SQLite.
    - Roda os modelos de IA (`analytics.py`).
2.  **Platform (NestJS)**:
    - API REST que serve o Frontend.
    - Lê do Banco de Dados compartilhado.
    - Integração com Python para queries de NLP (`assistant.py`).
3.  **Frontend (React + Vite)**:
    - Dashboard visual com gráficos (Recharts).
    - Componentes de KPI e Gauge de Risco.

## 🐳 Como Rodar (Docker)

**Pré-requisito**: Ter o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

A forma mais simples de subir todo o ambiente:

```bash
docker-compose up --build
```
*(Se der erro de comando não encontrado, tente `docker compose up --build`)*

Acesse o painel em: `http://localhost:80`

### Link publico com tunelamento

Link publico atual:

```text
https://flowers-after-guaranteed-roads.trycloudflare.com
```

O `docker-compose.yml` tambem sobe um tunel publico via Cloudflare Quick Tunnel. Depois de iniciar os containers, copie o link gerado nos logs:

```bash
docker compose logs -f tunnel
```

Procure uma URL parecida com `https://algum-nome.trycloudflare.com`. Esse sera o link publico do dashboard. Deixe o terminal/containers rodando enquanto estiver usando o link.

## 🛠️ Como Rodar (Manual)

Se preferir rodar serviço por serviço:

Note: Você precisará de 3 terminais.

1.  **Simulação & Dados**:
    ```bash
    # Instale as dependências
    pip install -r requirements.txt
    # Rode a simulação
    python run_simulation.py
    ```

2.  **Backend API**:
    ```bash
    cd platform
    npm install
    npm run start
    ```

3.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    Acesse em: `http://localhost:5173`

## 📂 Estrutura de Diretórios

- `/src` & `/run_simulation.py`: Código Python (Core).
- `/platform`: Código NestJS (API).
- `/frontend`: Código React (UI).
- `/docker-compose.yml`: Orquestração.
- `/docs`: Documentação detalhada da arquitetura.
