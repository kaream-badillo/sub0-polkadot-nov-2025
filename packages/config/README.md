# Configuracion Compartida (`packages/config`)

Este paquete define las primitivas de configuracion usadas por el indexer, la API y el dashboard. El contenido se basa en `cursor/project-context.md`.

## Contenido actual
- `src/index.ts` expone las interfaces `ChainProfile`, `WalletTarget`, `AlertRule` y arreglos de ejemplo (`chainProfiles`, `walletTargets`, `alertRules`).
- Los valores contienen placeholders `TODO_` para RPCs, direcciones y contactos que deben completarse antes del despliegue.
- La funcion `extendConfig` permite agregar perfiles o reglas adicionales sin modificar los ejemplos base.

## Como extender la configuracion
1. **Crear un archivo local** (por ejemplo `packages/config/custom.ts`) e importar lo expuesto por `src/index.ts`.
   ```ts
   import { extendConfig, ChainProfile } from './src';

   const newChains: ChainProfile[] = [
     {
       id: 'acme-parachain',
       name: 'Acme Parachain',
       rpcUrl: process.env.ACME_RPC_URL ?? 'TODO_ACME_RPC_URL',
       explorerUrl: 'https://TODO_ACME_EXPLORER',
       chainCategory: 'polkadot-sdk',
       nativeToken: { symbol: 'ACME', decimals: 12 }
     }
   ];

   export const fullConfig = extendConfig({ chainProfiles: newChains });
   ```
2. **Inyectar el resultado** (`fullConfig`) en `apps/indexer`, `apps/api` o `apps/web` segun corresponda.
3. **Documentar cambios** en `docs/internal/README.md` para mantener trazabilidad.

## Buenas practicas
- Mantener todos los secretos fuera del repositorio (usar `process.env` o vault).
- Usar prefijos `TODO_` para recordar datos pendientes.
- Validar la configuracion en CI antes de desplegar.
