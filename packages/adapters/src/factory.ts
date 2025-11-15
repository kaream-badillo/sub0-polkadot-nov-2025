/**
 * Factory function to create appropriate BalanceProvider based on chain configuration.
 */

import type { BalanceProvider } from './types/BalanceProvider';
import type { ChainProfile } from '@repo/config';
import { HyperbridgeProvider } from './providers/HyperbridgeProvider';
import { EvmProvider } from './providers/EvmProvider';

export interface BalanceProviderFactoryConfig {
  /** Use Hyperbridge for cross-chain queries (default: true) */
  useHyperbridge?: boolean;
  /** Hyperbridge indexer URL */
  hyperbridgeIndexerUrl?: string;
  /** Hyperbridge chain configuration */
  hyperbridgeChain?: {
    stateMachineId: string;
    wsUrl: string;
    hasher?: 'Keccak' | 'Blake2';
    consensusStateId: string;
  };
  /** Chain profiles to support */
  chainProfiles: ChainProfile[];
}

/**
 * Create a BalanceProvider instance based on configuration.
 * 
 * @param config - Factory configuration
 * @returns BalanceProvider instance
 */
export function createBalanceProvider(
  config: BalanceProviderFactoryConfig
): BalanceProvider {
  const useHyperbridge = config.useHyperbridge ?? true;

  if (useHyperbridge && config.hyperbridgeChain) {
    return new HyperbridgeProvider({
      indexerUrl: config.hyperbridgeIndexerUrl || process.env.HYPERBRIDGE_RPC_URL || 'http://localhost:3000',
      hyperbridgeChain: config.hyperbridgeChain,
      chainProfiles: config.chainProfiles
    });
  }

  // Fallback to direct EVM provider
  return new EvmProvider({
    chainProfiles: config.chainProfiles
  });
}

