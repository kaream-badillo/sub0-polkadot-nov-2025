/**
 * Wallet Routes
 * GET/POST endpoints for wallet management with real balance data
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { WalletIndexerService } from '@repo/indexer';
import type { WalletTarget } from '@repo/config';

interface WalletPluginOptions extends FastifyPluginOptions {
  indexerService: WalletIndexerService;
}

interface WalletWithBalance extends WalletTarget {
  latestSnapshot?: {
    balance: string;
    timestamp: number;
    delta?: string;
    percentageChange?: number;
  };
  totalBalance?: string; // Aggregated balance if multiple chains
}

export async function walletRoutes(
  fastify: FastifyInstance,
  options: WalletPluginOptions
) {
  const { indexerService } = options;

  // GET /wallets - List all registered wallets with aggregated balances
  fastify.get<{ Querystring: { includeBalance?: string } }>(
    '/wallets',
    {
      schema: {
        description: 'Get all registered wallets with their latest balances',
        tags: ['wallets'],
        querystring: {
          type: 'object',
          properties: {
            includeBalance: {
              type: 'string',
              enum: ['true', 'false'],
              description: 'Include latest balance snapshot (default: true)'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    label: { type: 'string' },
                    address: { type: 'string' },
                    chainId: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    importance: { type: 'string' },
                    latestSnapshot: {
                      type: 'object',
                      properties: {
                        balance: { type: 'string' },
                        timestamp: { type: 'number' },
                        delta: { type: 'string' },
                        percentageChange: { type: 'number' }
                      }
                    }
                  }
                }
              },
              count: { type: 'number' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const includeBalance = request.query.includeBalance !== 'false';
        const wallets = await indexerService.getAllWallets();

        const walletsWithBalances: WalletWithBalance[] = await Promise.all(
          wallets.map(async (wallet) => {
            const walletData: WalletWithBalance = { ...wallet };

            if (includeBalance) {
              const latestSnapshot = await indexerService.getLatestSnapshot(wallet.id);
              if (latestSnapshot) {
                // Get previous snapshot to calculate delta
                const history = await indexerService.getWalletHistory(wallet.id, 2);
                if (history.length > 1) {
                  const previous = history[1];
                  const currentBalance = BigInt(latestSnapshot.balance);
                  const previousBalance = BigInt(previous.balance);
                  const delta = currentBalance - previousBalance;
                  const percentageChange =
                    previousBalance === 0n
                      ? 0
                      : Number((delta * 10000n) / previousBalance) / 100;

                  walletData.latestSnapshot = {
                    balance: latestSnapshot.balance,
                    timestamp: latestSnapshot.timestamp,
                    delta: delta.toString(),
                    percentageChange
                  };
                } else {
                  walletData.latestSnapshot = {
                    balance: latestSnapshot.balance,
                    timestamp: latestSnapshot.timestamp
                  };
                }
              }
            }

            return walletData;
          })
        );

        return {
          success: true,
          data: walletsWithBalances,
          count: walletsWithBalances.length
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch wallets'
        };
      }
    }
  );

  // GET /wallets/:id - Get specific wallet details
  fastify.get<{ Params: { id: string } }>(
    '/wallets/:id',
    {
      schema: {
        description: 'Get specific wallet details with latest balance',
        tags: ['wallets'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Wallet ID' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                  address: { type: 'string' },
                  chainId: { type: 'string' },
                  latestSnapshot: { type: 'object' }
                }
              }
            }
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const wallets = await indexerService.getAllWallets();
        const wallet = wallets.find((w) => w.id === id);

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
    }
  );

  // GET /wallets/:id/history - Get wallet snapshot history
  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>(
    '/wallets/:id/history',
    {
      schema: {
        description: 'Get snapshot history for a wallet',
        tags: ['wallets'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Wallet ID' }
          },
          required: ['id']
        },
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'string',
              description: 'Maximum number of snapshots to return'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    walletId: { type: 'string' },
                    chainId: { type: 'string' },
                    balance: { type: 'string' },
                    timestamp: { type: 'number' }
                  }
                }
              },
              count: { type: 'number' }
            }
          }
        }
      }
    },
    async (request, reply) => {
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
    }
  );

  // POST /wallets - Register a new wallet for monitoring
  fastify.post<{ Body: WalletTarget }>(
    '/wallets',
    {
      schema: {
        description: 'Register a new wallet for monitoring',
        tags: ['wallets'],
        body: {
          type: 'object',
          required: ['id', 'address', 'chainId'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            address: { type: 'string' },
            chainId: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            importance: {
              type: 'string',
              enum: ['core-treasury', 'ops', 'watchlist']
            }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
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
    }
  );

  // DELETE /wallets/:id - Unregister a wallet
  fastify.delete<{ Params: { id: string } }>(
    '/wallets/:id',
    {
      schema: {
        description: 'Unregister a wallet from monitoring',
        tags: ['wallets'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Wallet ID' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
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
    }
  );
}
