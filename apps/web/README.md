## apps/web - Frontend Dashboard (Next.js + Tailwind + Zustand)

Frontend del **Cross-Chain Treasury Monitor**, construido con Next.js (App Router), Tailwind CSS y Zustand para estado global.

### Scripts

```bash
# Desde la raíz del repo
cd apps/web

# Desarrollo
npm run dev

# Lint
npm run lint

# Build de producción
npm run build
npm start
```

Por defecto, la app se sirve en `http://localhost:3000` (puedes cambiar el puerto con la variable de entorno `PORT` si lo necesitas para convivir con la API).

### Layout actual (Fase 3.1)

- **Sidebar (wallets)**: componente `app/wallet-sidebar.tsx`
  - Lista de wallets monitoreadas (mock por ahora) con selección básica.
  - Preparado para conectarse a la API `/wallets` en fases posteriores.
- **Panel principal**: componente `app/main-panel.tsx`
  - Zona central para balances agregados, movimientos y alertas.
  - Actualmente muestra placeholders explicando qué irá en cada bloque.
- **Estado global**: `store/useWalletStore.ts` (Zustand)
  - Maneja `selectedWalletId` y lista de wallets UI.

### Integración futura con la API

- Consumir `GET /wallets` y `GET /wallets/:id/history` de `apps/api`.
- Mapear la respuesta a `UiWallet` en el store de Zustand.
- Mostrar gráficos e historial en el panel principal (Recharts u otra librería).

### Despliegue (planificado)

- El frontend se desplegará en **Fly.io** como una app separada, apuntando a la URL pública de la API.
- La variable `NEXT_PUBLIC_API_URL` debe apuntar al backend (por ejemplo, `https://cross-chain-api.fly.dev`).
