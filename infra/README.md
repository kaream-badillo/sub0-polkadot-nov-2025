## Infraestructura (`infra`)

- Scripts para Docker Compose, Terraform/Ansible y CI/CD.
- Define variables, secretos (placeholder) y pipelines de despliegue.
- Depende de `apps/` y `packages/` empaquetados.
- Observabilidad (Prometheus, Grafana) y escalado automático (planificado).

### Docker Compose (plantillas)

- **Dev stack**: `docker-compose.dev.yml`
  - Servicios:
    - `api`: corre `apps/api` en modo dev (`npm run dev`).
    - `web`: corre `apps/web` en modo dev (`npm run dev`).
  - Uso:

```bash
cd infra
docker compose -f docker-compose.dev.yml up --build
```

- **Prod-like stack**: `docker-compose.prod.yml`
  - Usa imágenes preconstruidas:
    - `API_IMAGE` → `TODO_API_IMAGE` (por ejemplo `ghcr.io/TODO_OWNER/crosschain-api:TAG`).
    - `WEB_IMAGE` → `TODO_WEB_IMAGE` (por ejemplo `ghcr.io/TODO_OWNER/crosschain-web:TAG`).
  - Uso:

```bash
cd infra
API_IMAGE=TODO_API_IMAGE WEB_IMAGE=TODO_WEB_IMAGE docker compose -f docker-compose.prod.yml up -d
```

### Scripts de despliegue

- **Despliegue dev**: `deploy-dev.sh`

```bash
cd infra
./deploy-dev.sh    # Usa docker-compose.dev.yml
```

- **Despliegue prod-like**: `deploy-prod.sh`

```bash
cd infra
API_IMAGE=TODO_API_IMAGE \
WEB_IMAGE=TODO_WEB_IMAGE \
./deploy-prod.sh
```

> # Nota
> Estos scripts asumen un entorno tipo Unix (Linux/macOS). En Windows puedes usar WSL2 o traducirlos a PowerShell.

### Variables de entorno (placeholders TODO_)

- **API / Indexer**
  - `API_PORT` (default: `3000`)
  - `LOG_LEVEL` (default: `info`)
  - `API_RATE_LIMIT_PER_MINUTE` (default: `60`)
  - `INDEXER_SYNC_INTERVAL_MS` (default: `60000`)
  - `INDEXER_MAX_SNAPSHOTS_PER_WALLET` (default: `100`)
  - `ENABLE_HYPERBRIDGE` (default: `true`)
  - `ENABLE_EVM_CHAINS` (default: `true`)
  - `ENABLE_ALERTS` (default: `false`)

- **Hyperbridge**
  - `HYPERBRIDGE_RPC_URL` (default dev: `http://localhost:3000` o `http://host.docker.internal:3000`)
  - `HYPERBRIDGE_WS_URL` (default dev: `wss://gargantua.polytope.technology` o `wss://TODO_HYPERBRIDGE_WS_URL`)
  - `HYPERBRIDGE_STATE_MACHINE_ID` (ejemplo: `KUSAMA-4009`, prod: `TODO_STATE_MACHINE_ID`)
  - `HYPERBRIDGE_CONSENSUS_STATE_ID` (ejemplo: `PAS0`, prod: `TODO_CONSENSUS_STATE_ID`)
  - `HYPERBRIDGE_HASHER` (`Keccak` | `Blake2`, default: `Keccak`)

- **RPC chains** (rellenar con endpoints reales del hackathon / infra):
  - `POLKADOT_RPC_URL=wss://TODO_POLKADOT_RPC_URL`
  - `LISK_TESTNET_RPC_URL=https://TODO_LISK_TESTNET_RPC_URL`
  - `ETHEREUM_RPC_URL=https://TODO_ETHEREUM_RPC_URL`
  - `SEPOLIA_RPC_URL=https://TODO_SEPOLIA_RPC_URL`

- **Frontend**
  - `NEXT_PUBLIC_API_URL` (dev default: `http://localhost:3000`, en Compose: `http://api:3000`)
  - `WEB_PORT` (default: `3001`)

- **Imágenes (prod)**
  - `API_IMAGE=TODO_API_IMAGE`
  - `WEB_IMAGE=TODO_WEB_IMAGE`

### Observabilidad: logs + métricas

- **Logs estructurados (API)**:
  - La API (`apps/api`) usa **Fastify logger (pino)** con nivel controlado por `LOG_LEVEL` en `.env`.
  - Salida en JSON estructurado lista para ser enviada a Loki, Elastic o similar.

- **Métricas Prometheus (indexer + API)**:
  - La API expone `GET /metrics` en el mismo puerto que el resto del API (`API_PORT`).
  - Endpoint compatible con Prometheus usando `prom-client` desde el proceso que también ejecuta el indexer.
  - Incluye métricas de proceso por defecto (CPU, memoria, GC, event loop).

### Configuración Prometheus (ejemplo)

```yaml
scrape_configs:
  - job_name: cross-chain-treasury-api
    static_configs:
      - targets: ["api:3000"] # o "localhost:3000" en dev
    metrics_path: /metrics
```

### Dashboards sugeridos (Grafana)

- **Dashboard 1: Salud del indexer**
  - **Paneles**:
    - Uso de CPU y memoria del proceso.
    - Latencia del scrape de `/metrics`.
    - Series de tiempo para `process_resident_memory_bytes`, `process_cpu_user_seconds_total`, etc.

- **Dashboard 2: API Gateway**
  - **Paneles**:
    - Peticiones por ruta (`/wallets`, `/alerts`, `/chains`, `/health`).
    - Tasa de errores 4xx/5xx por minuto.
    - Latencia p95/p99 por endpoint (añadir histogramas en fases siguientes).

- **Dashboard 3: Alertas de negocio** (futuro)
  - **Ideas**:
    - Número de wallets indexadas.
    - Último timestamp de snapshot por wallet.
    - Número de alertas activas por tipo (`balance-drop`, etc.).
