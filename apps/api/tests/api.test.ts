/**
 * Basic API Tests with Vitest
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createIndexerService } from '@repo/indexer';
import { walletRoutes } from '../src/routes/wallets';
import { chainRoutes } from '../src/routes/chains';
import { alertRoutes } from '../src/routes/alerts';
import { walletTargets } from '@repo/config';

describe('API Gateway', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = Fastify({
      logger: false
    });

    await fastify.register(cors);
    
    const indexerService = createIndexerService();
    
    // Register test wallets
    for (const wallet of walletTargets) {
      await indexerService.registerWallet(wallet);
    }

    await fastify.register(walletRoutes, { indexerService });
    await fastify.register(chainRoutes);
    await fastify.register(alertRoutes);

    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('Health Check', () => {
    it('should return 200 OK on /health', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveProperty('status', 'ok');
    });
  });

  describe('Wallet Routes', () => {
    it('GET /wallets should return all wallets', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/wallets'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.count).toBeGreaterThan(0);
    });

    it('GET /wallets/:id should return specific wallet', async () => {
      const walletId = walletTargets[0]?.id;
      if (!walletId) return;

      const response = await fastify.inject({
        method: 'GET',
        url: `/wallets/${walletId}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id', walletId);
    });

    it('GET /wallets/:id/history should return snapshot history', async () => {
      const walletId = walletTargets[0]?.id;
      if (!walletId) return;

      const response = await fastify.inject({
        method: 'GET',
        url: `/wallets/${walletId}/history`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
    });

    it('POST /wallets should register a new wallet', async () => {
      const newWallet = {
        id: 'test-wallet-1',
        label: 'Test Wallet',
        address: '0x1234567890123456789012345678901234567890',
        chainId: 'polkadot-relay',
        tags: ['test'],
        importance: 'watchlist' as const
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/wallets',
        payload: newWallet
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id', newWallet.id);
    });
  });

  describe('Chain Routes', () => {
    it('GET /chains should return all chains', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/chains'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
    });

    it('GET /chains/:id should return specific chain', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/chains/polkadot-relay'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id', 'polkadot-relay');
    });
  });

  describe('Alert Routes', () => {
    it('GET /alerts should return all alerts', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/alerts'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
    });

    it('POST /alerts should create a new alert', async () => {
      const newAlert = {
        id: 'test-alert-1',
        walletId: 'treasury-polkadot-core',
        type: 'balance-drop' as const,
        direction: 'below' as const,
        threshold: 1000,
        windowMinutes: 15,
        enabled: true,
        channel: 'in-app' as const
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/alerts',
        payload: newAlert
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });
});

