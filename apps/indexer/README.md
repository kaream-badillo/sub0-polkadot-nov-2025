# Indexer Service (apps/indexer)

Servicio que orquesta storage queries multichain (Polkadot, Hyperbridge, EVM) y normaliza balances. Coordina snapshots, alertas y eventos para wallets monitoreadas con sincronización periódica automática.

## Arquitectura

El indexer sigue **Clean Architecture** con las siguientes capas:

### Capa Domain (src/domain/)
- **Entidades**: `WalletSnapshot`, `WalletSnapshotDelta`
- **Interfaces de repositorio**: `IWalletRepository`
- Sin dependencias externas, solo lógica de negocio pura.

### Capa Infrastructure (src/infrastructure/)
- **Repositorio en memoria**: `InMemoryWalletRepository`
- Implementa `IWalletRepository` para desarrollo/testing.
- Futuro: reemplazar por repositorio con persistencia (DB).

### Capa Application (src/application/)
- **Servicios**: `WalletIndexerService`
- Orquesta casos de uso y coordina domain + infrastructure.
- **Integra `BalanceProvider` de `packages/adapters`** para queries multichain.
- **Sistema de eventos** para notificar movimientos significativos.

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    WalletIndexerService                      │
│  (Application Layer - Orchestration + EventEmitter)         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐            ┌──────────────────────┐
│ IWalletRepo   │            │  BalanceProvider      │
│ (Interface)   │            │  (@repo/adapters)     │
└───────┬───────┘            └──────────────────────┘
        │                               │
        ▼                               ▼
┌───────────────────────┐   ┌──────────────────────┐
│ InMemoryWalletRepo    │   │ HyperbridgeProvider  │
│ (Infrastructure)      │   │ EvmProvider          │
│                       │   └──────────────────────┘
│ - wallets: Map        │
│ - snapshots: Map      │
└───────────────────────┘
```

## Pseudoflujo de Sincronización Periódica

```
┌─────────────────────────────────────────────────────────────────┐
│                  PERIODIC SYNC JOB                              │
└─────────────────────────────────────────────────────────────────┘

1. INICIO DEL JOB PERIÓDICO
   │
   ├─> WalletIndexerService.startPeriodicSync(intervalMs)
   │   │
   │   ├─> Configurar intervalo (default: 60000ms = 1 minuto)
   │   │
   │   ├─> Ejecutar sync inicial inmediatamente
   │   │
   │   └─> Programar ejecuciones periódicas con setInterval()
   │
   └─> Evento emitido: 'sync:started' { intervalMs }

2. EJECUCIÓN DE SYNC (cada intervalo)
   │
   ├─> WalletIndexerService.syncAllWallets()
   │   │
   │   └─> Evento emitido: 'sync:start' { walletCount }
   │
   ├─> Obtener todas las wallets registradas
   │   └─> walletRepository.getAllWallets()
   │
   ├─> PARA CADA WALLET (procesamiento paralelo futuro):
   │   │
   │   ├─> WalletIndexerService.createSnapshot(walletId)
   │   │   │
   │   │   ├─> Buscar wallet en repositorio
   │   │   │   └─> walletRepository.getWalletById(walletId)
   │   │   │
   │   │   ├─> Obtener balance usando BalanceProvider
   │   │   │   └─> balanceProvider.getBalance(address, chainId)
   │   │   │       │
   │   │   │       ├─> Si HyperbridgeProvider:
   │   │   │       │   ├─> Conectar a Hyperbridge chain
   │   │   │       │   ├─> Obtener latest block number
   │   │   │       │   ├─> Calcular storage key/slot
   │   │   │       │   └─> QueryStateProof(blockNumber, keys)
   │   │   │       │
   │   │   │       └─> Si EvmProvider:
   │   │   │           └─> ethers.JsonRpcProvider.getBalance()
   │   │   │
   │   │   ├─> Crear WalletSnapshot
   │   │   │   └─> {
   │   │   │       walletId, chainId, balance, timestamp
   │   │   │     }
   │   │   │
   │   │   ├─> Guardar snapshot en repositorio
   │   │   │   └─> walletRepository.saveSnapshot(snapshot)
   │   │   │
   │   │   ├─> Evento emitido: 'snapshot:created' { walletId, snapshot }
   │   │   │
   │   │   └─> DETECCIÓN DE MOVIMIENTOS SIGNIFICATIVOS
   │   │       │
   │   │       └─> checkSignificantMovement(walletId, currentSnapshot)
   │   │           │
   │   │           ├─> Obtener snapshot anterior
   │   │           │   └─> walletRepository.getLatestSnapshot(walletId)
   │   │           │
   │   │           ├─> Si no hay snapshot anterior → SKIP
   │   │           │
   │   │           ├─> Calcular diferencia
   │   │           │   ├─> delta = currentBalance - previousBalance
   │   │           │   ├─> percentageChange = (delta / previousBalance) * 100
   │   │           │   └─> Crear WalletSnapshotDelta
   │   │           │
   │   │           ├─> EVALUAR SI ES SIGNIFICATIVO
   │   │           │   │
   │   │           │   ├─> Threshold por defecto (config.defaultThresholdPercent)
   │   │           │   │   └─> Si |percentageChange| >= threshold → SIGNIFICATIVO
   │   │           │   │
   │   │           │   └─> Cambio absoluto mínimo (config.minAbsoluteChange)
   │   │           │       └─> Si |delta| >= minAbsoluteChange → SIGNIFICATIVO
   │   │           │
   │   │           └─> Si es SIGNIFICATIVO:
   │   │               │
   │   │               ├─> Buscar AlertRule coincidente
   │   │               │   └─> findMatchingAlertRule(walletId, delta)
   │   │               │       │
   │   │               │       ├─> Filtrar por walletId
   │   │               │       ├─> Filtrar por tipo (balance-drop, balance-increase, large-tx)
   │   │               │       ├─> Filtrar por dirección (above, below)
   │   │               │       └─> Verificar threshold de la regla
   │   │               │
   │   │               ├─> Evento emitido: 'movement:significant'
   │   │               │   └─> {
   │   │               │       walletId,
   │   │               │       delta: WalletSnapshotDelta,
   │   │               │       alertRule?: AlertRule
   │   │               │     }
   │   │               │
   │   │               └─> Si hay AlertRule coincidente y enabled:
   │   │                   └─> Evento emitido: 'alert:triggered'
   │   │                       └─> {
   │   │                           walletId,
   │   │                           alertRule,
   │   │                           delta
   │   │                         }
   │   │
   │   └─> Si error en snapshot:
   │       └─> Evento emitido: 'snapshot:error' { walletId, error }
   │
   └─> Evento emitido: 'sync:complete' { snapshotCount }

3. MANEJO DE ERRORES
   │
   └─> Si error en syncAllWallets():
       └─> Evento emitido: 'sync:error' { error }

4. DETENCIÓN DEL JOB
   │
   └─> WalletIndexerService.stopPeriodicSync()
       └─> Evento emitido: 'sync:stopped'
```

## Uso

### Básico (sin BalanceProvider)

```typescript
import { createIndexerService } from '@repo/indexer';
import { walletTargets } from '@repo/config';

const indexer = createIndexerService();

// Registrar wallets
for (const wallet of walletTargets) {
  await indexer.registerWallet(wallet);
}

// Sincronizar una vez
const snapshots = await indexer.syncAllWallets();
```

### Con BalanceProvider

```typescript
import { createIndexerService } from '@repo/indexer';
import { createBalanceProvider } from '@repo/adapters';
import { walletTargets, chainProfiles, alertRules } from '@repo/config';

// Crear BalanceProvider
const balanceProvider = createBalanceProvider({
  useHyperbridge: true,
  hyperbridgeIndexerUrl: process.env.HYPERBRIDGE_RPC_URL,
  hyperbridgeChain: {
    stateMachineId: 'KUSAMA-4009',
    wsUrl: 'wss://gargantua.polytope.technology',
    hasher: 'Keccak',
    consensusStateId: 'PAS0'
  },
  chainProfiles: chainProfiles
});

// Crear indexer con BalanceProvider y configuración
const indexer = createIndexerService(balanceProvider, {
  syncIntervalMs: 60000, // 1 minuto
  defaultThresholdPercent: 5, // 5% de cambio
  minAbsoluteChange: '1000000000000', // Cambio mínimo absoluto
  alertRules: alertRules
});

// Registrar wallets
for (const wallet of walletTargets) {
  await indexer.registerWallet(wallet);
}

// Escuchar eventos
indexer.on('movement:significant', (event) => {
  console.log('Movimiento significativo detectado:', event);
  console.log(`Wallet: ${event.walletId}`);
  console.log(`Delta: ${event.delta.delta}`);
  console.log(`Cambio porcentual: ${event.delta.percentageChange}%`);
});

indexer.on('alert:triggered', (event) => {
  console.log('Alerta activada:', event);
  // Enviar notificación (webhook, email, etc.)
});

// Iniciar job periódico
indexer.startPeriodicSync();

// Detener job periódico
// indexer.stopPeriodicSync();
```

### Eventos Disponibles

```typescript
// Sincronización
indexer.on('sync:started', ({ intervalMs }) => {});
indexer.on('sync:start', ({ walletCount }) => {});
indexer.on('sync:complete', ({ snapshotCount }) => {});
indexer.on('sync:stopped', () => {});
indexer.on('sync:error', ({ error }) => {});

// Snapshots
indexer.on('snapshot:created', ({ walletId, snapshot }) => {});
indexer.on('snapshot:error', ({ walletId, error }) => {});

// Movimientos
indexer.on('movement:significant', ({ walletId, delta, alertRule }) => {});

// Alertas
indexer.on('alert:triggered', ({ walletId, alertRule, delta }) => {});

// Wallets
indexer.on('wallet:registered', ({ walletId, wallet }) => {});
indexer.on('wallet:unregistered', ({ walletId }) => {});
```

## Configuración

### IndexerServiceConfig

```typescript
interface IndexerServiceConfig {
  /** Intervalo de sincronización en ms (default: 60000 = 1 minuto) */
  syncIntervalMs?: number;
  
  /** Threshold por defecto para cambios significativos en % (default: 5) */
  defaultThresholdPercent?: number;
  
  /** Cambio mínimo absoluto para considerar significativo (default: '0') */
  minAbsoluteChange?: string;
  
  /** Reglas de alerta para detección de movimientos */
  alertRules?: AlertRule[];
}
```

### Variables de Entorno

```bash
INDEXER_SYNC_INTERVAL_MS=60000  # Intervalo de sincronización
HYPERBRIDGE_RPC_URL=http://localhost:3000  # Hyperbridge indexer URL
```

## Dependencias

- `@repo/config`: Interfaces compartidas (`WalletTarget`, `ChainProfile`, `AlertRule`)
- `@repo/adapters`: `BalanceProvider` para queries multichain

## Desarrollo

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Modo desarrollo (watch)
npm run dev

# Ejecutar
npm start
```

## Próximos Pasos

1. ✅ Integrar `BalanceProvider` de `packages/adapters` - **COMPLETADO**
2. ✅ Implementar cola de sincronización periódica - **COMPLETADO**
3. ✅ Agregar detección de cambios significativos - **COMPLETADO**
4. ✅ Integrar con sistema de alertas (`AlertRule`) - **COMPLETADO**
5. Reemplazar `InMemoryWalletRepository` por persistencia (PostgreSQL/SQLite).
6. Implementar procesamiento paralelo de wallets.
7. Agregar retry logic para queries fallidas.
8. Implementar rate limiting para RPCs.
