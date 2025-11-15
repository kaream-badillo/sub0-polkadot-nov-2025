# Adaptadores de Datos (packages/adapters)

Proveedores de balance (`BalanceProvider`) para consultar balances de wallets a través de múltiples blockchains usando Hyperbridge SDK y RPC directo.

## Características

- ✅ **Interfaz común** `BalanceProvider` para abstraer queries multichain
- ✅ **HyperbridgeProvider** - Queries cross-chain verificadas por state proofs
- ✅ **EvmProvider** - Queries directas vía RPC para chains EVM
- ✅ **Factory pattern** para crear providers según configuración
- ✅ **Soporte TypeScript** completo

## Instalación

```bash
cd packages/adapters
npm install
```

## Uso

### Importar BalanceProvider

```typescript
import { createBalanceProvider, type BalanceProvider } from '@repo/adapters';
import { chainProfiles } from '@repo/config';
```

### Crear HyperbridgeProvider

```typescript
const provider = createBalanceProvider({
  useHyperbridge: true,
  hyperbridgeIndexerUrl: process.env.HYPERBRIDGE_RPC_URL || 'http://localhost:3000',
  hyperbridgeChain: {
    stateMachineId: 'KUSAMA-4009',
    wsUrl: 'wss://gargantua.polytope.technology',
    hasher: 'Keccak',
    consensusStateId: 'PAS0'
  },
  chainProfiles: chainProfiles
});

// Obtener balance
const balance = await provider.getBalance(
  '0x1234567890123456789012345678901234567890',
  'polkadot-relay'
);
```

### Crear EvmProvider (Directo)

```typescript
const provider = createBalanceProvider({
  useHyperbridge: false,
  chainProfiles: chainProfiles
});

// Obtener balance
const balance = await provider.getBalance(
  '0x1234567890123456789012345678901234567890',
  'lisk-testnet'
);
```

### Usar en Indexer

```typescript
import { createBalanceProvider } from '@repo/adapters';
import { createIndexerService } from '@repo/indexer';
import { chainProfiles } from '@repo/config';

// Crear balance provider
const balanceProvider = createBalanceProvider({
  useHyperbridge: true,
  hyperbridgeIndexerUrl: process.env.HYPERBRIDGE_RPC_URL,
  hyperbridgeChain: {
    stateMachineId: 'TODO_STATE_MACHINE_ID',
    wsUrl: process.env.HYPERBRIDGE_WS_URL || 'wss://gargantua.polytope.technology',
    hasher: 'Keccak',
    consensusStateId: 'TODO_CONSENSUS_STATE_ID'
  },
  chainProfiles: chainProfiles
});

// Crear indexer con balance provider
const indexer = createIndexerService(undefined, balanceProvider);
```

## BalanceProvider Interface

```typescript
interface BalanceProvider {
  /**
   * Get the current balance of a wallet address on a specific chain.
   * @param address - Wallet address to query
   * @param chainId - Chain identifier (from ChainProfile.id)
   * @returns Balance as a string (in wei/smallest unit)
   */
  getBalance(address: string, chainId: string): Promise<string>;

  /**
   * Check if this provider supports a specific chain.
   */
  supportsChain(chainId: string): boolean;

  /**
   * Get the native token symbol for a chain (e.g., "DOT", "ETH").
   */
  getNativeTokenSymbol(chainId: string): Promise<string>;
}
```

## HyperbridgeProvider

Usa `@hyperbridge/sdk` para hacer storage queries cross-chain verificadas por state proofs.

### Requisitos

- **Hyperbridge Indexer URL**: Endpoint del indexer de Hyperbridge
- **Hyperbridge Chain Config**: Configuración de la chain Substrate de Hyperbridge
- **Chain Profiles**: Perfiles de chains soportadas desde `@repo/config`

### Configuración

```typescript
const provider = new HyperbridgeProvider({
  indexerUrl: 'http://localhost:3000', // Hyperbridge indexer API
  hyperbridgeChain: {
    stateMachineId: 'KUSAMA-4009',
    wsUrl: 'wss://gargantua.polytope.technology',
    hasher: 'Keccak',
    consensusStateId: 'PAS0'
  },
  chainProfiles: chainProfiles
});
```

### Storage Queries

HyperbridgeProvider usa `SubstrateChain.queryStateProof()` para hacer storage queries verificadas:

- **EVM Chains**: Calcula storage slot del balance y lo consulta vía Hyperbridge
- **Substrate Chains**: Consulta `System::Account` storage key vía Hyperbridge

### Variables de Entorno

```bash
HYPERBRIDGE_RPC_URL=http://localhost:3000  # Hyperbridge indexer API URL
HYPERBRIDGE_WS_URL=wss://gargantua.polytope.technology  # Hyperbridge WebSocket
```

## EvmProvider

Proveedor directo para chains EVM usando `ethers.js` y RPC directo.

### Requisitos

- **RPC URLs**: URLs de RPC configuradas en `ChainProfile.rpcUrl`
- **Chain Profiles**: Perfiles de chains EVM desde `@repo/config`

### Configuración

```typescript
const provider = new EvmProvider({
  chainProfiles: chainProfiles.filter(p => p.chainCategory === 'evm')
});
```

### Uso Directo

```typescript
// Obtener balance
const balance = await provider.getBalance(
  '0x1234567890123456789012345678901234567890',
  'lisk-testnet'
);

// Verificar soporte
const supported = await provider.supportsChain('lisk-testnet');
```

## Inyección de RPCs

Los RPCs se inyectan desde `ChainProfile.rpcUrl` en `packages/config/src/index.ts`:

```typescript
export const chainProfiles: ChainProfile[] = [
  {
    id: 'polkadot-relay',
    name: 'Polkadot Relay Chain',
    rpcUrl: process.env.POLKADOT_RPC_URL || 'TODO_POLKADOT_RPC_URL',
    chainCategory: 'polkadot-sdk',
    nativeToken: { symbol: 'DOT', decimals: 10 }
  },
  {
    id: 'lisk-testnet',
    name: 'Lisk Testnet',
    rpcUrl: process.env.LISK_TESTNET_RPC_URL || 'TODO_LISK_TESTNET_RPC_URL',
    chainCategory: 'evm',
    nativeToken: { symbol: 'tLSK', decimals: 18 }
  }
];
```

### Actualizar RPCs

1. Editar `packages/config/src/index.ts`
2. Reemplazar `TODO_RPC_URL` con URLs reales
3. O usar variables de entorno (ver `env.example` en raíz)

## Batching y Manejo de Errores

### Batching (Futuro)

Los providers actualmente hacen queries individuales. En el futuro se puede implementar:

- Batching de múltiples queries en una sola llamada
- Caching de balances para reducir queries redundantes
- Rate limiting para evitar sobrecarga de RPCs

### Manejo de Errores

```typescript
try {
  const balance = await provider.getBalance(address, chainId);
} catch (error) {
  if (error.message.includes('not supported')) {
    // Chain no soportada
  } else if (error.message.includes('Failed to get balance')) {
    // Error de red o RPC
  }
}
```

## Testing

```bash
npm test
```

## Estructura

```
packages/adapters/
├── src/
│   ├── index.ts                    # Exports principales
│   ├── types/
│   │   └── BalanceProvider.ts     # Interface BalanceProvider
│   ├── providers/
│   │   ├── HyperbridgeProvider.ts # Provider para Hyperbridge
│   │   └── EvmProvider.ts         # Provider para EVM directo
│   └── factory.ts                  # Factory para crear providers
├── package.json
├── tsconfig.json
└── README.md
```

## Próximos Pasos

1. **Completar implementación de storage queries**:
   - Implementar `calculateBalanceSlot()` para EVM
   - Implementar `calculateSubstrateAccountKey()` para Substrate
   - Parsear proofs para extraer balances

2. **Integrar con indexer**:
   - Inyectar `BalanceProvider` en `WalletIndexerService`
   - Usar en job periódico de sincronización

3. **Mejoras futuras**:
   - Soporte ENS para direcciones
   - Feeds externos (APIs de explorers)
   - Simulaciones y testing

## Referencias

- [`@hyperbridge/sdk`](https://github.com/polytope-labs/hyperbridge-sdk) - Hyperbridge SDK oficial
- [`docs/Hyperbridge-SDK/`](../docs/Hyperbridge-SDK/) - Documentación del SDK
- [`docs/hackathon.md`](../docs/hackathon.md) - Contexto del hackathon
- [`cursor/project-context.md`](../../cursor/project-context.md) - Contexto del proyecto
