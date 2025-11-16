## apps/web/tests - Playwright e2e

Suite de pruebas end-to-end para el dashboard del **Cross-Chain Treasury Monitor** usando Playwright.

Las pruebas **mockean la API** (`/wallets`, `/wallets/:id/history`, `/alerts`) vía route interception, por lo que **no es necesario** levantar `apps/api` para ejecutarlas.

### Requisitos

- Node.js LTS
- Dependencias instaladas en `apps/web`:

```bash
cd apps/web
npm install
```

Para instalar los navegadores de Playwright (solo la primera vez):

```bash
npx playwright install
```

### Ejecutar pruebas en local

1. Levantar el frontend:

```bash
cd apps/web
npm run dev
```

2. En otra terminal, ejecutar Playwright:

```bash
cd apps/web
npx playwright test
```

Por defecto, se usará `http://localhost:3000` como `baseURL`. Puedes sobreescribirlo con `PLAYWRIGHT_BASE_URL`.

### Modo headless / UI

- **Headless (por defecto)**:

```bash
npx playwright test
```

- **Con UI para debug**:

```bash
npx playwright test --ui
```

### Flujo validado (e2e-flow.spec.ts)

La spec `tests/e2e-flow.spec.ts` valida el flujo principal:

1. Mockea respuestas de:
   - `GET /wallets?includeBalance=true`
   - `GET /wallets/:id/history?limit=50`
   - `POST /alerts`
2. Abre `/` y comprueba:
   - Render de sidebar con la wallet mockeada.
   - Selección de wallet y render del gráfico de historial.
   - Añadir un tag y ver el toast de confirmación.
   - Crear una alerta y ver el toast de éxito.

### Ejemplo de configuración CI (GitHub Actions)

```yaml
name: e2e-web

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        working-directory: apps/web
        run: npm install

      - name: Install Playwright browsers
        working-directory: apps/web
        run: npx playwright install --with-deps

      - name: Start web app
        working-directory: apps/web
        run: npm run dev &

      - name: Run Playwright tests
        working-directory: apps/web
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
        run: npx playwright test
```


