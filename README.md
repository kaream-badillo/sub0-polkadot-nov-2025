# Cross-Chain Treasury Monitor

> **Dashboard multichain para monitorear wallets públicas relevantes (DAOs, tesorerías, protocolos) en un solo panel.**

## Índice

- **[1. Visión general](#1-visión-general)**
- **[2. Requisitos](#2-requisitos)**
- **[3. Instalación y configuración](#3-instalación-y-configuración)**
- **[4. Cómo correr indexer, API y web](#4-cómo-correr-indexer-api-y-web)**
- **[5. Pasos de demo (MVP)](#5-pasos-de-demo-mvp)**
- **[6. Troubleshooting](#6-troubleshooting)**
- **[7. Roadmap breve](#7-roadmap-breve)**
- **[8. Documentación adicional](#8-documentación-adicional)**

---

## 1. Visión general

**Cross-Chain Treasury Monitor** centraliza la actividad de wallets públicas relevantes (DAOs, fundaciones, tesorerías) a través de múltiples blockchains (Polkadot, parachains, EVM, etc.).  
Objetivo: **transparencia financiera multichain** sin tener que revisar múltiples explorers.

- **Problema**:
  - Las organizaciones operan en varias redes.
  - Rastrear balances, detectar grandes movimientos y auditar gastos implica revisar muchos explorers.
  - Es fácil perder contexto histórico y señales importantes.

- **Solución**:
  - Panel único con:
    - Lista de wallets etiquetadas.
    - Último balance y gráfico de historial por wallet.
    - Configuración de alertas (ej. cambios porcentuales).
  - Backend indexador + API Gateway.
  - Integración con **Hyperbridge** para queries cross-chain (alineado con el track del hackathon).

---

## 2. Requisitos

### 2.1. Herramientas

- **Node.js** `>= 18` (ideal `>= 20`).
- **npm** moderno o un gestor de workspaces (`pnpm`/`yarn`).  
- **Git**.
- Opcional:
  - **Docker + Docker Compose** (para usar las plantillas en `infra/`).
  - Navegador reciente (Chrome/Brave/Firefox) para el dashboard.

### 2.2. Variables de entorno (resumen)

Todas se documentan en `env.example`. Las más importantes:

- **API / indexer**
  - `API_PORT=3000`
  - `LOG_LEVEL=info`
  - `API_RATE_LIMIT_PER_MINUTE=60`
  - `INDEXER_SYNC_INTERVAL_MS=60000`
  - `INDEXER_MAX_SNAPSHOTS_PER_WALLET=100`
  - `ENABLE_HYPERBRIDGE=true`
  - `ENABLE_EVM_CHAINS=true`
  - `ENABLE_ALERTS=false`

- **Hyperbridge** (con defaults para dev):
  - `HYPERBRIDGE_RPC_URL=http://localhost:3000`
  - `HYPERBRIDGE_WS_URL=wss://gargantua.polytope.technology`
  - `HYPERBRIDGE_STATE_MACHINE_ID=KUSAMA-4009`
  - `HYPERBRIDGE_CONSENSUS_STATE_ID=PAS0`
  - `HYPERBRIDGE_HASHER=Keccak`

- **RPCs de chains (placeholders `TODO_`)**
  - `POLKADOT_RPC_URL=wss://TODO_POLKADOT_RPC_URL`
  - `LISK_TESTNET_RPC_URL=https://TODO_LISK_TESTNET_RPC_URL`
  - `ETHEREUM_RPC_URL=https://TODO_ETHEREUM_RPC_URL`
  - `SEPOLIA_RPC_URL=https://TODO_SEPOLIA_RPC_URL`

- **Frontend**
  - `NEXT_PUBLIC_API_URL=http://localhost:3000`
  - `WEB_PORT=3001`

---

## 3. Instalación y configuración

### 3.1. Clonar el repo

```bash
git clone https://github.com/kaream-badillo/sub0-polkadot-nov-2025.git
cd sub0-2025
```

### 3.2. Variables de entorno

```bash
cp env.example .env
# Edita .env con tus valores. Puedes dejar los TODO_ si solo vas a hacer una demo local.
```

Para una **prueba mínima** sin Hyperbridge:

```bash
API_PORT=3000
ENABLE_HYPERBRIDGE=false
LOG_LEVEL=info
```

### 3.3. Instalación de dependencias

Hay dos opciones según tu gestor de paquetes:

- **Opción A (recomendada): gestor con workspaces (pnpm/yarn)**  
  (ajusta si usas yarn)

```bash
# En la raíz del monorepo
pnpm install
```

- **Opción B: npm sin soporte workspace** — instalar por módulos:

```bash
# Config & adapters
cd packages/config && npm install && cd ..
cd adapters && npm install && cd ../..

# Indexer
cd apps/indexer && npm install && cd ../..

# API
cd apps/api && npm install && cd ../..

# Web
cd apps/web && npm install && cd ../..
```

### 3.4. Build (opcional para dev, recomendado para prod)

```bash
cd apps/indexer && npm run build && cd ../..
cd apps/api && npm run build && cd ../..
cd apps/web && npm run build && cd ../..
```

---

## 4. Cómo correr indexer, API y web

El diseño actual corre el **indexer dentro del proceso de la API** (`apps/api` usa `createIndexerService` de `@repo/indexer`).

### 4.1. Correr API + indexer

```bash
cd apps/api
npm run dev
```

- Fastify escucha en `http://localhost:3000` (o `API_PORT`).
- Rutas principales:
  - `GET /wallets`, `GET /wallets/:id`, `GET /wallets/:id/history`
  - `POST /wallets`, `DELETE /wallets/:id`
  - `GET /alerts`, `POST /alerts`, `DELETE /alerts/:id`
  - `GET /chains`, `GET /chains/:id`
  - `GET /health`
  - `GET /metrics` (Prometheus, `prom-client`)
- Swagger/OpenAPI: `http://localhost:3000/docs`.

### 4.2. Correr frontend (dashboard web)

```bash
cd apps/web
npm run dev
```

Por defecto:

- Next.js en `http://localhost:3001`.
- Usa `NEXT_PUBLIC_API_URL` para hablar con la API (por defecto `http://localhost:3000`).

Para modo producción:

```bash
cd apps/web
npm run build
npm start
```

### 4.3. Opción Docker Compose (dev)

Usa las plantillas de `infra/`:

```bash
cd infra
docker compose -f docker-compose.dev.yml up --build
```

Servicios:

- `api` → `http://localhost:3000`
- `web` → `http://localhost:3001`

---

## 5. Pasos de demo (MVP)

La demo objetivo (para hackathon) es:

1. **Levantar stack**
   - API + indexer: `cd apps/api && npm run dev`.
   - Web: `cd apps/web && npm run dev`.

2. **Verificar API**

```bash
curl http://localhost:3000/health
curl http://localhost:3000/wallets
curl http://localhost:3000/metrics
```

3. **Abrir dashboard**

- Visita `http://localhost:3001`.
- Deberías ver:
  - Sidebar de wallets (`wallet-sidebar`).
  - Panel principal (`main-panel`) con:
    - Último balance.
    - Gráfico de historial.
    - Sección **Tags & alerts**.

4. **Flujo de usuario esperado**

- En la sidebar:
  - Seleccionar una wallet de la lista (inyectada desde `@repo/config` vía API).
- En el panel principal:
  - Ver el último balance (`Latest balance`).
  - Ver el gráfico (`History`) si ya hay snapshots.
  - Añadir y borrar etiquetas.
  - Crear una alerta (formulario que llama `POST /alerts`).

5. **Suite e2e (Playwright)**

```bash
cd apps/web
npm run dev       # en una terminal
npm run test:e2e  # en otra
```

- La suite espera ciertas wallets (p.ej. una llamada “Ethereum Foundation”); verifica o ajusta `packages/config` si es necesario.

---

## 6. Troubleshooting

### 6.1. `npm install` falla con `workspace:*`

- **Síntoma**:  
  `npm error Unsupported URL Type "workspace:"`
- **Causa**:  
  `npm` sin soporte completo para workspaces.
- **Solución**:
  - Usar `pnpm`/`yarn` con workspaces y correr `pnpm install` en la raíz; o
  - Instalar dependencias módulo a módulo (ver sección 3.3, opción B).

### 6.2. Error Next.js: hooks solo en Client Components

- **Síntoma**:  
  Mensaje del tipo: “This React Hook only works in a Client Component”.
- **Causa**:  
  Falta `"use client"` al inicio de componentes en `apps/web/app`.
- **Estado actual**:  
  `page.tsx` y `main-panel.tsx` incluyen correctamente:

```12:18:apps/web/app/page.tsx
"use client";
```

Si el error reaparece, revisa que la primera línea sea exactamente esa.

### 6.3. TypeScript: `string | null` no asignable a `string`

- **Síntoma**:  
  Error en `useWalletHistory` por pasar `selectedWalletId` (que puede ser `null`) a `fetchWalletHistory`.
- **Estado actual**:  
  El hook ya comprueba `if (!selectedWalletId) return;` y luego usa `selectedWalletId!`.  
  Si copias el patrón a otro lado, respeta esa comprobación.

### 6.4. Tests e2e no encuentran wallets

- **Síntoma**:  
  Playwright busca un botón con texto `Ethereum Foundation` y falla.
- **Causa**:  
  `walletTargets` en `@repo/config` no incluye esa wallet o tiene otro `label`.
- **Solución**:
  - Ajusta `packages/config/src/index.ts` para incluir una wallet con ese `label`; o
  - Cambia el test en `apps/web/tests/e2e-flow.spec.ts` para que use una wallet existente.

### 6.5. `/metrics` no devuelve nada útil

- Confirma:
  - API levantada (`GET /health` OK).
  - Sin errores de import de `prom-client`.
  - En despliegues con reverse proxy, que `/metrics` no esté bloqueado.

---

## 7. Roadmap breve

El roadmap detallado está en `docs/ROADMAP-PASOS.md`. Resumen:

- **Fase 0** – Estructura modular del monorepo ✅
- **Fase 1** – Fundamentos backend & indexer ✅
- **Fase 2** – Queries multichain + Hyperbridge ⏳
- **Fase 3** – Dashboard frontend (UI/UX, charts, alerts UI) ⏳
- **Fase 4** – QA, observabilidad, seguridad (e2e, `/metrics`, logging, rate limit, Zod) ⏳
- **Fase 5** – Deploy, demo y documentación (este README, Docker Compose) ✅
- **Fase 6** – Extras (ENS, oráculos, ZK, etc.) ⏳

### 7.1. Extensiones futuras con Hyperbridge (ideas para jurado)

- **Watched wallets → Governance / votos cross-chain (via Hyperbridge SDK)**  
  - Extender la sección de wallets vigiladas para:
    - Mostrar **historial de votos on-chain** asociados a una treasury (p.ej. referendums, governance tracks) leyendo storage de chains Polkadot-SDK.
    - Resolver y agrupar **propuestas on-chain** en las que una wallet ha participado (sí/no/abstención) como “timeline de gobernanza”.
  - Implementable con `@hyperbridge/sdk` usando:
    - `SubstrateChain` + `queryStateProof` para extraer eventos de gobernanza relacionados a la dirección.
    - `IndexerClient` para seguir el estado de mensajes/referendos entre chains.
  - Estado: **diseño en proceso** (pensado como Fase 6.x, demostrando cómo Hyperbridge habilita vistas de gobernanza multichain encima del MVP actual).

---

## 8. Documentación adicional

- `cursor/project-context.md` – contexto normativo del proyecto (scope, pitch, prioridades).
- `docs/ARCHITECTURE.md` – arquitectura del monorepo e indexer.
- `docs/ROADMAP-PASOS.md` – roadmap completo por fases/pasos.
- `docs/VALIDATION-PHASE2.md` – guía para validar Fase 2 (API + indexer).
- `infra/README.md` – despliegue con Docker Compose y variables `TODO_`.
- `apps/api/README.md` – documentación específica de la API.
- `apps/web/README.md` – detalles del dashboard y UX.

Licencia: **MIT**  
Autor principal: **Kaream Badillo (@kaream-badillo)**  
Creado para **sub0 HACK 2025 (Polkadot / Hyperbridge)**.

