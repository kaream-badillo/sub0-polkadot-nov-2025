## Infraestructura (`infra`)

- Scripts para Docker Compose, Terraform/Ansible y CI/CD.
- Define variables, secretos (placeholder) y pipelines de despliegue.
- Depende de `apps/` y `packages/` empaquetados.
- Observabilidad (Prometheus, Grafana) y escalado automático (planificado).

### Observabilidad: logs + métricas

- **Logs estructurados (API)**:
  - La API (`apps/api`) usa **Fastify logger (pino)** con nivel controlado por `LOG_LEVEL` en `.env`.
  - Salida en JSON estructurado lista para ser enviada a Loki, Elastic o similar.

- **Métricas Prometheus (indexer + API)**:
  - La API expone `GET /metrics` en el mismo puerto que el resto del API (`API_PORT`).
  - Endpoint compatible con Prometheus usando `prom-client` desde el proceso que también ejecuta el indexer.
  - Incluye métricas de proceso por defecto (CPU, memoria, GC, event loop).

### Configuración Prometheus (ejemplo)

- **Job Prometheus sugerido**:

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
