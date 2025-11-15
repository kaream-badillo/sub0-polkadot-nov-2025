# API Gateway (apps/api)

API Gateway REST para el Cross-Chain Treasury Monitor. Expone endpoints para gestionar wallets, chains y alertas, consumiendo el servicio indexer en memoria.

## Características

- ✅ Servidor Fastify con TypeScript
- ✅ Endpoints REST para wallets, chains y alerts
- ✅ Integración con `apps/indexer` (repositorio en memoria)
- ✅ Testing básico con Vitest
- ✅ CORS habilitado para desarrollo
- ✅ Health check endpoint

## Instalación

```bash
cd apps/api
npm install
```

## Desarrollo

```bash
# Modo desarrollo (watch)
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar producción
npm start

# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage
```

## Endpoints Disponibles

### Health Check

```bash
# GET /health - Verificar estado del servidor
curl http://localhost:3000/health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": 1700000000000
}
```

### Wallets

#### Listar todas las wallets

```bash
# GET /wallets - Obtener todas las wallets registradas
curl http://localhost:3000/wallets
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "treasury-polkadot-core",
      "label": "Main Treasury Multisig",
      "address": "0x...",
      "chainId": "polkadot-relay",
      "tags": ["treasury", "core"],
      "importance": "core-treasury"
    }
  ],
  "count": 1
}
```

#### Obtener wallet específica

```bash
# GET /wallets/:id - Obtener detalles de una wallet
curl http://localhost:3000/wallets/treasury-polkadot-core
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "treasury-polkadot-core",
    "label": "Main Treasury Multisig",
    "address": "0x...",
    "chainId": "polkadot-relay",
    "tags": ["treasury", "core"],
    "importance": "core-treasury",
    "latestSnapshot": {
      "walletId": "treasury-polkadot-core",
      "chainId": "polkadot-relay",
      "balance": "1000000000000",
      "timestamp": 1700000000000
    }
  }
}
```

#### Obtener historial de wallet

```bash
# GET /wallets/:id/history - Obtener historial de snapshots
curl http://localhost:3000/wallets/treasury-polkadot-core/history

# Con límite
curl http://localhost:3000/wallets/treasury-polkadot-core/history?limit=10
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "walletId": "treasury-polkadot-core",
      "chainId": "polkadot-relay",
      "balance": "1000000000000",
      "timestamp": 1700000000000
    }
  ],
  "count": 1
}
```

#### Registrar nueva wallet

```bash
# POST /wallets - Registrar una nueva wallet para monitoreo
curl -X POST http://localhost:3000/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-wallet-1",
    "label": "Test Wallet",
    "address": "0x1234567890123456789012345678901234567890",
    "chainId": "polkadot-relay",
    "tags": ["test"],
    "importance": "watchlist"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "test-wallet-1",
    "label": "Test Wallet",
    "address": "0x1234567890123456789012345678901234567890",
    "chainId": "polkadot-relay",
    "tags": ["test"],
    "importance": "watchlist"
  },
  "message": "Wallet registered successfully"
}
```

#### Eliminar wallet

```bash
# DELETE /wallets/:id - Desregistrar una wallet
curl -X DELETE http://localhost:3000/wallets/test-wallet-1
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Wallet unregistered successfully"
}
```

### Chains

#### Listar todas las chains

```bash
# GET /chains - Obtener todas las chains soportadas
curl http://localhost:3000/chains
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "polkadot-relay",
      "name": "Polkadot Relay Chain",
      "rpcUrl": "TODO_POLKADOT_RPC_URL",
      "explorerUrl": "TODO_POLKADOT_EXPLORER",
      "chainCategory": "polkadot-sdk",
      "nativeToken": {
        "symbol": "DOT",
        "decimals": 10
      }
    }
  ],
  "count": 1
}
```

#### Obtener chain específica

```bash
# GET /chains/:id - Obtener detalles de una chain
curl http://localhost:3000/chains/polkadot-relay
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "polkadot-relay",
    "name": "Polkadot Relay Chain",
    "rpcUrl": "TODO_POLKADOT_RPC_URL",
    "chainCategory": "polkadot-sdk",
    "nativeToken": {
      "symbol": "DOT",
      "decimals": 10
    }
  }
}
```

### Alerts

#### Listar todas las alertas

```bash
# GET /alerts - Obtener todas las reglas de alerta
curl http://localhost:3000/alerts
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-large-outgoing-dot",
      "walletId": "treasury-polkadot-core",
      "type": "balance-drop",
      "direction": "below",
      "threshold": 10000,
      "windowMinutes": 15,
      "enabled": true,
      "channel": "webhook"
    }
  ],
  "count": 1
}
```

#### Obtener alerta específica

```bash
# GET /alerts/:id - Obtener detalles de una alerta
curl http://localhost:3000/alerts/alert-large-outgoing-dot
```

#### Crear nueva alerta

```bash
# POST /alerts - Crear una nueva regla de alerta
curl -X POST http://localhost:3000/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "alert-test-1",
    "walletId": "treasury-polkadot-core",
    "type": "balance-drop",
    "direction": "below",
    "threshold": 5000,
    "windowMinutes": 10,
    "enabled": true,
    "channel": "in-app"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "alert-test-1",
    "walletId": "treasury-polkadot-core",
    "type": "balance-drop",
    "direction": "below",
    "threshold": 5000,
    "windowMinutes": 10,
    "enabled": true,
    "channel": "in-app"
  },
  "message": "Alert rule created successfully"
}
```

#### Eliminar alerta

```bash
# DELETE /alerts/:id - Eliminar una regla de alerta
curl -X DELETE http://localhost:3000/alerts/alert-test-1
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Alert rule deleted successfully"
}
```

## Variables de Entorno

Ver `env.example` en la raíz del proyecto. Variables relevantes:

- `API_PORT` - Puerto del servidor (default: 3000)
- `LOG_LEVEL` - Nivel de logging (default: info)

## Estructura del Proyecto

```
apps/api/
├── src/
│   ├── index.ts              # Punto de entrada del servidor
│   └── routes/
│       ├── wallets.ts        # Rutas de wallets
│       ├── chains.ts         # Rutas de chains
│       └── alerts.ts         # Rutas de alerts
├── tests/
│   └── api.test.ts           # Tests básicos con Vitest
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Testing

Ejecutar tests:

```bash
npm test
```

Ejecutar tests con cobertura:

```bash
npm run test:coverage
```

## Integración con Indexer

El API Gateway consume el servicio `WalletIndexerService` desde `apps/indexer`:

```typescript
import { createIndexerService } from '@repo/indexer';

const indexerService = createIndexerService();
// Usar indexerService en las rutas
```

## Próximos Pasos

1. Integrar con `packages/adapters` para queries multichain reales
2. Implementar validación de schemas con Zod
3. Agregar rate limiting
4. Implementar autenticación (opcional)
5. Generar documentación OpenAPI
6. Agregar caching para mejor rendimiento

## Dependencias

- `@repo/config` - Interfaces compartidas
- `@repo/indexer` - Servicio de indexación
- `fastify` - Framework web
- `@fastify/cors` - Soporte CORS
- `vitest` - Framework de testing
