/**
 * API Gateway Entry Point
 * Cross-Chain Treasury Monitor - API Gateway Module
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createIndexerService } from '@repo/indexer';
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

// Create indexer service instance
const indexerService = createIndexerService();

// Register routes
fastify.register(walletRoutes, { indexerService });
fastify.register(chainRoutes);
fastify.register(alertRoutes);

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: Date.now() };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.API_PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 API Gateway listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

