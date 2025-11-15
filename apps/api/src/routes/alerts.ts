/**
 * Alert Routes
 * GET/POST endpoints for alert configuration
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { alertRules } from '@repo/config';
import type { AlertRule } from '@repo/config';

export async function alertRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // GET /alerts - List all alert rules
  fastify.get('/alerts', async (request, reply) => {
    try {
      return {
        success: true,
        data: alertRules,
        count: alertRules.length
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch alerts'
      };
    }
  });

  // GET /alerts/:id - Get specific alert rule
  fastify.get<{ Params: { id: string } }>('/alerts/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const alert = alertRules.find(a => a.id === id);

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
  });

  // POST /alerts - Create a new alert rule
  fastify.post<{ Body: AlertRule }>('/alerts', async (request, reply) => {
    try {
      const alert = request.body;

      // Basic validation
      if (!alert.id || !alert.walletId || !alert.type || !alert.threshold) {
        reply.code(400);
        return {
          success: false,
          error: 'Missing required fields: id, walletId, type, threshold'
        };
      }

      // TODO: Store alert in indexer or separate service
      // For now, just return success (stub implementation)

      reply.code(201);
      return {
        success: true,
        data: alert,
        message: 'Alert rule created successfully'
      };
    } catch (error: any) {
      fastify.log.error(error);
      reply.code(400);
      return {
        success: false,
        error: error.message || 'Failed to create alert'
      };
    }
  });

  // DELETE /alerts/:id - Delete an alert rule
  fastify.delete<{ Params: { id: string } }>('/alerts/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Remove alert from storage
      // For now, just return success (stub implementation)

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
  });
}

