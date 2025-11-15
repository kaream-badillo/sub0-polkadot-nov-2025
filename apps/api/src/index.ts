/**
 * API Gateway Entry Point
 * Cross-Chain Treasury Monitor - API Gateway Module
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createIndexerService, type IndexerServiceConfig } from '@repo/indexer';
import { createBalanceProvider } from '@repo/adapters';
import { chainProfiles, alertRules, walletTargets } from '@repo/config';
import { walletRoutes } from './routes/wallets';
import { chainRoutes } from './routes/chains';
import { alertRoutes } from './routes/alerts';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

// Register CORS
fastify.register(cors, {
  origin: true // Allow all origins in development
});

// Register Swagger/OpenAPI
fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Cross-Chain Treasury Monitor API',
      description: 'API Gateway for monitoring wallet balances across multiple blockchains',
      version: '0.1.0'
    },
    servers: [
      {
        url: `http://localhost:${process.env.API_PORT || 3000}`,
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'wallets', description: 'Wallet management and monitoring' },
      { name: 'chains', description: 'Blockchain chain information' },
      { name: 'alerts', description: 'Alert rules configuration' },
      { name: 'health', description: 'Health check endpoints' }
    ]
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
});

// Create BalanceProvider
const balanceProvider = createBalanceProvider({
  useHyperbridge: process.env.ENABLE_HYPERBRIDGE !== 'false',
  hyperbridgeIndexerUrl: process.env.HYPERBRIDGE_RPC_URL || 'http://localhost:3000',
  hyperbridgeChain: {
    stateMachineId: process.env.HYPERBRIDGE_STATE_MACHINE_ID || 'KUSAMA-4009',
    wsUrl: process.env.HYPERBRIDGE_WS_URL || 'wss://gargantua.polytope.technology',
    hasher: (process.env.HYPERBRIDGE_HASHER as 'Keccak' | 'Blake2') || 'Keccak',
    consensusStateId: process.env.HYPERBRIDGE_CONSENSUS_STATE_ID || 'PAS0'
  },
  chainProfiles: chainProfiles
});

// Create indexer service with BalanceProvider and configuration
const indexerConfig: IndexerServiceConfig = {
  syncIntervalMs: Number(process.env.INDEXER_SYNC_INTERVAL_MS) || 60000, // Default 1 minute
  defaultThresholdPercent: 5, // Default 5% change threshold
  minAbsoluteChange: '0',
  alertRules: alertRules
};

const indexerService = createIndexerService(balanceProvider, indexerConfig);

// Register wallets from config
(async () => {
  try {
    for (const wallet of walletTargets) {
      await indexerService.registerWallet(wallet);
    }
    fastify.log.info(`Registered ${walletTargets.length} wallets from config`);
  } catch (error) {
    fastify.log.error('Failed to register initial wallets:', error);
  }
})();

// Register routes
fastify.register(walletRoutes, { indexerService });
fastify.register(chainRoutes);
fastify.register(alertRoutes, { indexerService, indexerConfig });

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: Date.now(),
    version: '0.1.0'
  };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 API Gateway listening on http://localhost:${port}`);
    console.log(`📚 API Documentation available at http://localhost:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
