# 🟣 Cross-Chain Treasury Monitor

> **Aplicación Web3 para monitorear wallets públicas importantes (DAOs, tesorerías, protocolos) a través de múltiples blockchains en un solo panel.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Polkadot](https://img.shields.io/badge/Polkadot-Ecosystem-purple)](https://polkadot.network/)

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#sobre-el-proyecto)
- [Contexto del Hackathon](#contexto-del-hackathon)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso](#uso)
- [Roadmap](#roadmap)
- [Contribución](#contribución)
- [Licencia](#licencia)

## 🎯 Sobre el Proyecto

**Cross-Chain Treasury Monitor** es una herramienta Web3 que centraliza la actividad financiera de wallets públicas relevantes (DAOs, fundaciones, tesorerías) a través de múltiples blockchains. Entrega transparencia multichain sin necesidad de revisar múltiples explorers por separado.

### Problema que Resuelve

Las organizaciones Web3 suelen operar en varias redes (Polkadot, Kusama, parachains, Ethereum, etc.), lo que hace difícil:
- Rastrear cambios en balances
- Detectar grandes movimientos
- Monitorear gastos y entradas
- Seguir la salud financiera de DAOs o tesorerías

Los usuarios tienen que revisar múltiples explorers, uno por chain, lo cual es complejo y fácil de pasar por alto.

### Solución

La app permite:
- **Agregar y etiquetar wallets públicas** relevantes
- **Consultar su estado actual** (balance, actividad reciente)
- **Resaltar entradas/salidas significativas**
- **Panel único** con actividad multichain
- **Accesos directos** a explorers específicos
- **Integración directa** con storage queries cross-chain para datos confiables on-chain

## 🏆 Contexto del Hackathon

Este proyecto fue desarrollado para el **sub0 HACK — 72hr Hackathon (Polkadot Ecosystem)**:

- **Evento:** sub0 HACK — a 72-hour hackathon
- **Fecha:** 14–16 noviembre 2025
- **Lugar:** Bubble Studios, Buenos Aires
- **Track Elegido:** **Hyperbridge** — $5,000 Bounty Pool
  - 🥇 $3,000
  - 🥈 $1,500
  - 🥉 $500

### Alineación con Hyperbridge Track

Este proyecto demuestra el uso del **Hyperbridge SDK** para:
- Leer información de cualquier blockchain conectada (Polkadot, parachains, EVM, etc.)
- Demostrar **interoperabilidad real** mediante lecturas verificadas por pruebas de estado
- Mostrar cómo un usuario puede obtener información multichain sin necesidad de ir a múltiples explorers
- Resolver fricciones del día a día en Web3 con casos de uso claros y prácticos

## ✨ Características

### Implementadas

- ✅ **Estructura modular** con Clean Architecture
- ✅ **Configuración compartida** (`packages/config`) con interfaces TypeScript
- ✅ **Servicio indexador** (`apps/indexer`) con repositorio en memoria
- ✅ **Sistema de snapshots** para historial de balances
- ✅ **Preparado para adaptadores** multichain (Hyperbridge, EVM)

### En Desarrollo

- 🚧 **API Gateway** (`apps/api`) con endpoints REST
- 🚧 **Frontend Dashboard** (`apps/web`) con Next.js
- 🚧 **Integración Hyperbridge** para queries cross-chain
- 🚧 **Sistema de alertas** para movimientos significativos

## 🏗️ Arquitectura

El proyecto sigue una arquitectura de **monorepo** con separación clara de responsabilidades:

```
sub0-2025/
├── apps/
│   ├── indexer/      # Servicio de indexación (Clean Architecture)
│   ├── api/          # API Gateway (Fastify/Express)
│   └── web/          # Frontend Dashboard (Next.js)
├── packages/
│   ├── config/       # Configuración compartida (interfaces, tipos)
│   └── adapters/     # Adaptadores para queries multichain
├── infra/            # Scripts de despliegue (Docker, Terraform)
└── docs/             # Documentación del proyecto
```

### Clean Architecture (Indexer)

El servicio indexador implementa Clean Architecture con tres capas:

- **Domain**: Entidades y contratos de repositorio
- **Infrastructure**: Implementación en memoria (futuro: persistencia)
- **Application**: Servicios de orquestación

Ver más detalles en [`apps/indexer/README.md`](apps/indexer/README.md).

## 🚀 Instalación

### Requisitos Previos

- Node.js >= 18.0.0
- npm o yarn
- TypeScript >= 5.0

### Setup

```bash
# Clonar el repositorio
git clone https://github.com/kaream-badillo/sub0-polkadot-nov-2025.git
cd sub0-polkadot-nov-2025

# Instalar dependencias (cuando se configure workspace)
npm install

# Compilar TypeScript
cd apps/indexer
npm run build
```

### Configuración

1. Copiar y configurar variables de entorno:
   ```bash
   cp env.example .env
   # Editar .env con tus valores
   ```

2. Variables de entorno necesarias (ver `env.example`):
   - `HYPERBRIDGE_RPC_URL` - Endpoint de Hyperbridge (obtener del hackathon)
   - `POLKADOT_RPC_URL` - RPC de Polkadot
   - `API_PORT` - Puerto del API Gateway (default: 3000)
   - `INDEXER_SYNC_INTERVAL_MS` - Intervalo de sincronización (default: 60000)

3. Actualizar placeholders en `packages/config/src/index.ts`:
   - `TODO_RPC_URL` → URLs de RPC reales
   - `TODO_CHAIN_ID` → IDs de chains
   - `TODO_WALLET_ADDR` → Direcciones de wallets a monitorear

## 💻 Uso

### Indexer Service

```typescript
import { createIndexerService } from '@repo/indexer';
import { walletTargets } from '@repo/config';

// Crear instancia del servicio
const indexer = createIndexerService();

// Registrar wallets para monitoreo
for (const wallet of walletTargets) {
  await indexer.registerWallet(wallet);
}

// Sincronizar todas las wallets
const snapshots = await indexer.syncAllWallets();

// Obtener historial de una wallet
const history = await indexer.getWalletHistory('wallet-id', 10);
```

### API (Próximamente)

```bash
# Iniciar servidor API
cd apps/api
npm run dev

# Endpoints disponibles:
GET  /wallets           # Listar todas las wallets
GET  /wallets/:id       # Detalles de una wallet
GET  /wallets/:id/history  # Historial de snapshots
POST /wallets           # Agregar nueva wallet
POST /alerts            # Configurar alerta
```

## 📊 Roadmap

Ver el roadmap completo en [`docs/ROADMAP-PASOS.md`](docs/ROADMAP-PASOS.md).

### Fases Principales

- [x] **Fase 0**: Estructura modular inicial
- [x] **Fase 1.1**: Configuración y contratos de datos
- [x] **Fase 1.2**: Servicio base indexador
- [ ] **Fase 1.3**: API Gateway mínima
- [ ] **Fase 2**: Queries multichain e integración Hyperbridge
- [ ] **Fase 3**: Frontend Dashboard
- [ ] **Fase 4**: QA, Observabilidad y Seguridad
- [ ] **Fase 5**: Deploy, Demo y Documentación

## 👥 Casos de Uso

- **Monitorear tesorerías de DAOs**
- **Seguir wallets críticas** de proyectos o fundaciones
- **Auditar movimientos de fondos** (entradas, gastos, retiros)
- **Detectar comportamientos sospechosos** en tiempo real
- **Crear transparencia financiera** para comunidades multichain

## 🎯 Usuarios Objetivo

- Miembros de DAOs y equipos core
- Analistas de ecosistemas y auditores
- Usuarios retail que buscan transparencia
- Builders que trabajan con arquitectura multichain

## 🔧 Tecnologías

- **TypeScript** - Lenguaje principal
- **Node.js** - Runtime
- **Hyperbridge SDK** - Queries cross-chain
- **Clean Architecture** - Patrón arquitectónico
- **Monorepo** - Estructura de proyecto

## 📝 Documentación

- [`docs/ROADMAP-PASOS.md`](docs/ROADMAP-PASOS.md) - Roadmap de desarrollo
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Arquitectura del proyecto
- [`docs/STRUCTURE-EXPLANATION.md`](docs/STRUCTURE-EXPLANATION.md) - Explicación de la estructura
- [`docs/INTERNAL.md`](docs/INTERNAL.md) - Decisiones técnicas y runbooks
- [`docs/info-sdk`](docs/info-sdk) - Información sobre Hyperbridge SDK
- [`cursor/project-context.md`](cursor/project-context.md) - Contexto del proyecto
- [`apps/indexer/README.md`](apps/indexer/README.md) - Documentación del indexer

## 🤝 Contribución

Este proyecto fue desarrollado para el sub0 HACK hackathon. Las contribuciones son bienvenidas después del evento.

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👤 Autor

**Kaream Badillo**
- Email: kaream.badillo@usach.cl
- GitHub: [@kaream-badillo](https://github.com/kaream-badillo)

## 🙏 Agradecimientos

- **Polkadot Ecosystem** por el hackathon sub0 HACK
- **Hyperbridge** por el SDK y las herramientas de interoperabilidad
- **Comunidad Web3** por la inspiración y feedback

---

**Desarrollado con ❤️ para el sub0 HACK 2025**

