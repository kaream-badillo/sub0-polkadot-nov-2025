# Indexer Service (apps/indexer)

Servicio que orquesta storage queries multichain (Polkadot, Hyperbridge, EVM) y normaliza balances. Coordina snapshots, alertas y eventos para wallets monitoreadas.

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
- Futuro: integrará `BalanceProvider` de `packages/adapters`.

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    WalletIndexerService                      │
│  (Application Layer - Orchestration)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐            ┌──────────────────────┐
│ IWalletRepo   │            │  BalanceProvider      │
│ (Interface)   │            │  (Future Adapter)     │
└───────┬───────┘            └──────────────────────┘
        │
        ▼
┌───────────────────────┐
│ InMemoryWalletRepo    │
│ (Infrastructure)      │
│                       │
│ - wallets: Map        │
│ - snapshots: Map      │
└───────────────────────┘
```

## Flujo de Sincronización

```
1. WalletIndexerService.syncAllWallets()
   │
   ├─> Obtiene todas las wallets registradas
   │
   ├─> Para cada wallet:
   │   │
   │   ├─> WalletIndexerService.createSnapshot(walletId)
   │   │   │
   │   │   ├─> Busca wallet en repositorio
   │   │   │
   │   │   ├─> [Futuro] BalanceProvider.getBalance(address, chainId)
   │   │   │   └─> Retorna balance normalizado
   │   │   │
   │   │   ├─> Crea WalletSnapshot con timestamp
   │   │   │
   │   │   └─> Repository.saveSnapshot(snapshot)
   │   │       └─> Almacena en memoria (futuro: DB)
   │   │
   │   └─> [Futuro] Detecta cambios significativos
   │       └─> Emite eventos para alertas
   │
   └─> Retorna array de snapshots creados
```

## Uso

```typescript
import { createIndexerService } from '@repo/indexer';
import { walletTargets } from '@repo/config';

const indexer = createIndexerService();

// Registrar wallets
for (const wallet of walletTargets) {
  await indexer.registerWallet(wallet);
}

// Sincronizar todas las wallets
const snapshots = await indexer.syncAllWallets();

// Obtener historial de una wallet
const history = await indexer.getWalletHistory('wallet-id', 10);
```

## Dependencias

- `@repo/config`: Interfaces compartidas (`WalletTarget`, `ChainProfile`, etc.)
- Futuro: `@repo/adapters`: `BalanceProvider` para queries multichain

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

1. Integrar `BalanceProvider` de `packages/adapters` para queries reales.
2. Reemplazar `InMemoryWalletRepository` por persistencia (PostgreSQL/SQLite).
3. Implementar cola de sincronización periódica (cron job o worker).
4. Agregar detección de cambios significativos y emisión de eventos.
5. Integrar con sistema de alertas (`AlertRule` de `packages/config`).
