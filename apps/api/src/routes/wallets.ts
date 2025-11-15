/**
 * Wallet Routes
 * GET/POST endpoints for wallet management
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { WalletIndexerService } from '@repo/indexer';
import type { WalletTarget } from '@repo/config';

interface WalletPluginOptions extends FastifyPluginOptions {
  indexerService: WalletIndexerService;
}

export async function walletRoutes(
  fastify: FastifyInstance,
  options: WalletPluginOptions
) {
  const { indexerService } = options;

  // GET /wallets - List all registered wallets
  fastify.get('/wallets', async (request, reply) => {
    try {
      const wallets = await indexerService.getAllWallets();
      return {
        success: true,
        data: wallets,
        count: wallets.length
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch wallets'
      };
    }
  });

  // GET /wallets/:id - Get specific wallet details
  fastify.get<{ Params: { id: string } }>('/wallets/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const wallets = await indexerService.getAllWallets();
      const wallet = wallets.find(w => w.id === id);

      if (!wallet) {
        reply.code(404);
        return {
          success: false,
          error: 'Wallet not found'
        };
      }

      const latestSnapshot = await indexerService.getLatestSnapshot(id);

      return {
        success: true,
        data: {
          ...wallet,
          latestSnapshot
        }
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch wallet'
      };
    }
  });

  // GET /wallets/:id/history - Get wallet snapshot history
  fastify.get<{ 
    Params: { id: string };
    Querystring: { limit?: string };
  }>('/wallets/:id/history', async (request, reply) => {
    try {
      const { id } = request.params;
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : undefined;

      const history = await indexerService.getWalletHistory(id, limit);

      return {
        success: true,
        data: history,
        count: history.length
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch wallet history'
      };
    }
  });

  // POST /wallets - Register a new wallet for monitoring
  fastify.post<{ Body: WalletTarget }>('/wallets', async (request, reply) => {
    try {
      const wallet = request.body;

      // Basic validation
      if (!wallet.id || !wallet.address || !wallet.chainId) {
        reply.code(400);
        return {
          success: false,
          error: 'Missing required fields: id, address, chainId'
        };
      }

      await indexerService.registerWallet(wallet);

      reply.code(201);
      return {
        success: true,
        data: wallet,
        message: 'Wallet registered successfully'
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400);
      return {
        success: false,
        error: error.message || 'Failed to register wallet'
      };
    }
  });

  // DELETE /wallets/:id - Unregister a wallet
  fastify.delete<{ Params: { id: string } }>('/wallets/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      await indexerService.unregisterWallet(id);

      return {
        success: true,
        message: 'Wallet unregistered successfully'
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400);
      return {
        success: false,
        error: error.message || 'Failed to unregister wallet'
      };
    }
  });
}

