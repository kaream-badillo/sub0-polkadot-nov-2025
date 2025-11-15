/**
 * Indexer Service Entry Point
 * Cross-Chain Treasury Monitor - Indexer Module
 */

import { InMemoryWalletRepository } from './infrastructure/repositories/InMemoryWalletRepository';
import { WalletIndexerService, type IndexerServiceConfig } from './application/services/WalletIndexerService';
import type { WalletTarget } from '@repo/config';
import type { BalanceProvider } from '@repo/adapters';

// Export types and interfaces for external consumption
export * from './domain/entities';
export * from './domain/repositories/IWalletRepository';
export * from './application/services/WalletIndexerService';

/**
 * Factory function to create a configured indexer service instance.
 * 
 * @param balanceProvider - Optional BalanceProvider for fetching balances
 * @param config - Optional configuration for sync interval and thresholds
 * @returns Configured WalletIndexerService instance
 */
export function createIndexerService(
  balanceProvider?: BalanceProvider,
  config?: IndexerServiceConfig
): WalletIndexerService {
  const repository = new InMemoryWalletRepository();
  const service = new WalletIndexerService(repository, balanceProvider, config);
  return service;
}

/**
 * Example usage (for testing/documentation):
 * ```ts
 * const indexer = createIndexerService();
 * await indexer.registerWallet({ id: 'wallet-1', ... });
 * await indexer.syncAllWallets();
 * ```
 */

