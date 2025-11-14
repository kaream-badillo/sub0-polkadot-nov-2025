# Indexer (apps/indexer)

- Orquesta storage queries multichain (Polkadot, Hyperbridge, EVM) y normaliza balances.
- Coordina snapshots, alertas y eventos para wallets monitoreadas.
- DependerÃ¡ de `packages/config` (targets, chains) y `packages/adapters` (providers de datos).
- ExpondrÃ¡ eventos y repositorios consumidos por `apps/api`.
- Futuro: persistencia (DB), colas y monitoreo.
