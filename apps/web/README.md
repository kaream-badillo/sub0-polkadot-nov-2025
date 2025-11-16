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

### Layout actual (Fase 3.1 / 3.3)

- **Sidebar (wallets)**: componente `app/wallet-sidebar.tsx`
  - Consume `GET /wallets` para mostrar wallets registradas.
  - Permite seleccionar la wallet activa.
- **Panel principal**: componente `app/main-panel.tsx`
  - Muestra balance más reciente y gráfico de historial (snapshots).
  - Incluye formularios para **editar etiquetas** y **crear alertas**.
- **Estado global**: `store/useWalletStore.ts` (Zustand)
  - Maneja `selectedWalletId`, lista de wallets UI y tags en memoria.

### Integración con la API

- Hooks disponibles:
  - `hooks/useWallets.ts`: llama a `GET /wallets?includeBalance=true` y sincroniza la lista de wallets y la selección actual con el store de Zustand.
  - `hooks/useWalletHistory.ts`: llama a `GET /wallets/:id/history?limit=50` para construir el historial de snapshots de la wallet seleccionada.
- El chart de historial usa **Recharts** y se renderiza en `app/main-panel.tsx`.

### Configurar la API base URL

- El frontend usa la variable `NEXT_PUBLIC_API_URL` para construir las URLs de la API.
- Si no se define, por defecto usa `http://localhost:3000`.

Ejemplo de `.env.local` en `apps/web`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

En producción (por ejemplo en Fly.io) deberías apuntar a la URL pública del backend, por ejemplo:

```bash
NEXT_PUBLIC_API_URL=https://cross-chain-api.fly.dev
```

### Flujo de usuario (etiquetas y alertas)

1. El usuario selecciona una wallet en el sidebar.
2. En el panel **Tags & alerts**:
   - Puede agregar o eliminar tags:
     - Validación client-side (no vacío, longitud máxima, sin duplicados).
     - Los tags se guardan solo en el estado del frontend (MVP, sin persistencia backend).
   - Puede crear/actualizar una alerta:
     - Define `Threshold (% change)`, `Window (minutes)`, `Direction` y `Channel`.
     - El formulario hace `POST /alerts` (endpoint del backend).
     - Si la operación es exitosa, se muestra un toast de éxito; si falla, un toast de error.
3. Los toasts se gestionan vía `components/toast-provider.tsx` y se usan desde `app/main-panel.tsx`.

### Despliegue (planificado)

- El frontend se desplegará en **Fly.io** como una app separada, apuntando a la URL pública de la API.
- La variable `NEXT_PUBLIC_API_URL` debe apuntar al backend (por ejemplo, `https://cross-chain-api.fly.dev`).
