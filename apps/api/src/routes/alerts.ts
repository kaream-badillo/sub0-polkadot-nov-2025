/**
 * Alert Routes
 * GET/POST endpoints for alert configuration with indexer integration
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { WalletIndexerService, IndexerServiceConfig } from '@repo/indexer';
import { alertRules } from '@repo/config';
import type { AlertRule } from '@repo/config';
import { z } from 'zod';

interface AlertPluginOptions extends FastifyPluginOptions {
  indexerService: WalletIndexerService;
  indexerConfig: IndexerServiceConfig;
}

const alertSchema = z.object({
  id: z.string().min(1),
  walletId: z.string().min(1),
  type: z.enum(['balance-drop', 'balance-increase', 'large-tx', 'custom']),
  direction: z.enum(['above', 'below']),
  threshold: z.number().positive(),
  windowMinutes: z.number().int().min(1).default(10),
  enabled: z.boolean(),
  channel: z.enum(['in-app', 'webhook', 'email'])
});

// In-memory storage for alert rules (TODO: replace with persistent storage)
let alertRulesStorage: AlertRule[] = [...alertRules];

export async function alertRoutes(
  fastify: FastifyInstance,
  options: AlertPluginOptions
) {
  const { indexerService, indexerConfig } = options;

  // GET /alerts - List all alert rules
  fastify.get(
    '/alerts',
    {
      schema: {
        description: 'Get all alert rules',
        tags: ['alerts'],
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
                    walletId: { type: 'string' },
                    type: {
                      type: 'string',
                      enum: ['balance-drop', 'balance-increase', 'large-tx', 'custom']
                    },
                    direction: { type: 'string', enum: ['above', 'below'] },
                    threshold: { type: 'number' },
                    windowMinutes: { type: 'number' },
                    enabled: { type: 'boolean' },
                    channel: {
                      type: 'string',
                      enum: ['in-app', 'webhook', 'email']
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
        return {
          success: true,
          data: alertRulesStorage,
          count: alertRulesStorage.length
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch alerts'
        };
      }
    }
  );

  // GET /alerts/:id - Get specific alert rule
  fastify.get<{ Params: { id: string } }>(
    '/alerts/:id',
    {
      schema: {
        description: 'Get specific alert rule',
        tags: ['alerts'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Alert rule ID' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
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
        const alert = alertRulesStorage.find((a) => a.id === id);

        if (!alert) {
          reply.code(404);
          return {
            success: false,
            error: 'Alert not found'
          };
        }

        return {
          success: true,
          data: alert
        };
      } catch (error) {
        fastify.log.error(error);
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch alert'
        };
      }
    }
  );

  // POST /alerts - Create a new alert rule
  fastify.post<{ Body: AlertRule }>(
    '/alerts',
    {
      schema: {
        description: 'Create a new alert rule and update indexer thresholds',
        tags: ['alerts'],
        body: {
          type: 'object',
          required: ['id', 'walletId', 'type', 'threshold', 'direction', 'enabled', 'channel'],
          properties: {
            id: { type: 'string' },
            walletId: { type: 'string' },
            type: {
              type: 'string',
              enum: ['balance-drop', 'balance-increase', 'large-tx', 'custom']
            },
            direction: { type: 'string', enum: ['above', 'below'] },
            threshold: { type: 'number', description: 'Threshold value for the alert' },
            windowMinutes: { type: 'number', description: 'Time window in minutes' },
            enabled: { type: 'boolean' },
            channel: {
              type: 'string',
              enum: ['in-app', 'webhook', 'email']
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
        const parseResult = alertSchema.safeParse(request.body);
        if (!parseResult.success) {
          reply.code(400);
          return {
            success: false,
            error: 'Invalid alert payload',
            details: parseResult.error.issues
          };
        }

        const alert = parseResult.data;

        // Check if wallet exists (only accept alerts for valid wallets)
        const wallets = await indexerService.getAllWallets();
        const walletExists = wallets.some((w) => w.id === alert.walletId);
        if (!walletExists) {
          reply.code(400);
          return {
            success: false,
            error: `Wallet ${alert.walletId} not found`
          };
        }

        // Check if alert already exists
        const existingIndex = alertRulesStorage.findIndex((a) => a.id === alert.id);
        if (existingIndex >= 0) {
          // Update existing alert
          alertRulesStorage[existingIndex] = alert;
        } else {
          // Add new alert
          alertRulesStorage.push(alert);
        }

        // Update indexer configuration with new alert rules
        indexerConfig.alertRules = alertRulesStorage;

        fastify.log.info(`Alert rule ${alert.id} ${existingIndex >= 0 ? 'updated' : 'created'}`);

        reply.code(201);
        return {
          success: true,
          data: alert,
          message: `Alert rule ${existingIndex >= 0 ? 'updated' : 'created'} successfully`
        };
      } catch (error: any) {
        fastify.log.error(error);
        reply.code(400);
        return {
          success: false,
          error: error.message || 'Failed to create alert'
        };
      }
    }
  );

  // DELETE /alerts/:id - Delete an alert rule
  fastify.delete<{ Params: { id: string } }>(
    '/alerts/:id',
    {
      schema: {
        description: 'Delete an alert rule',
        tags: ['alerts'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Alert rule ID' }
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

        const index = alertRulesStorage.findIndex((a) => a.id === id);
        if (index < 0) {
          reply.code(404);
          return {
            success: false,
            error: 'Alert not found'
          };
        }

        alertRulesStorage.splice(index, 1);

        // Update indexer configuration
        indexerConfig.alertRules = alertRulesStorage;

        fastify.log.info(`Alert rule ${id} deleted`);

        return {
          success: true,
          message: 'Alert rule deleted successfully'
        };
      } catch (error: any) {
        fastify.log.error(error);
        reply.code(400);
        return {
          success: false,
          error: error.message || 'Failed to delete alert'
        };
      }
    }
  );
}
