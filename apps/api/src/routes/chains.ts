/**
 * Chain Routes
 * GET/POST endpoints for chain configuration
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { chainProfiles } from '@repo/config';

export async function chainRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // GET /chains - List all supported chains
  fastify.get('/chains', async (request, reply) => {
    try {
      return {
        success: true,
        data: chainProfiles,
        count: chainProfiles.length
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch chains'
      };
    }
  });

  // GET /chains/:id - Get specific chain details
  fastify.get<{ Params: { id: string } }>('/chains/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const chain = chainProfiles.find(c => c.id === id);

      if (!chain) {
        reply.code(404);
        return {
          success: false,
          error: 'Chain not found'
        };
      }

      return {
        success: true,
        data: chain
      };
    } catch (error) {
      fastify.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch chain'
      };
    }
  });
}

