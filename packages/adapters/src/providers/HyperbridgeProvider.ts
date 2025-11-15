/**
 * HyperbridgeProvider
 * Uses @hyperbridge/sdk to query balances via cross-chain storage queries.
 * Supports Polkadot-SDK chains and EVM chains through Hyperbridge.
 */

import type { BalanceProvider } from '../types/BalanceProvider';
import type { ChainProfile } from '@repo/config';
import { SubstrateChain, EvmChain, createQueryClient } from '@hyperbridge/sdk';

export interface HyperbridgeProviderConfig {
  /** Hyperbridge indexer API URL */
  indexerUrl: string;
  /** Hyperbridge Substrate chain configuration */
  hyperbridgeChain: {
    stateMachineId: string;
    wsUrl: string;
    hasher?: 'Keccak' | 'Blake2';
    consensusStateId: string;
  };
  /** Chain profiles to support */
  chainProfiles: ChainProfile[];
}

export class HyperbridgeProvider implements BalanceProvider {
  private queryClient: ReturnType<typeof createQueryClient>;
  private hyperbridgeChain: SubstrateChain;
  private chainProfiles: Map<string, ChainProfile>;
  private evmChains: Map<string, EvmChain> = new Map();

  constructor(config: HyperbridgeProviderConfig) {
    // Initialize query client for Hyperbridge indexer
    this.queryClient = createQueryClient({
      url: config.indexerUrl || process.env.HYPERBRIDGE_RPC_URL || 'http://localhost:3000'
    });

    // Initialize Hyperbridge Substrate chain
    this.hyperbridgeChain = new SubstrateChain({
      stateMachineId: config.hyperbridgeChain.stateMachineId,
      wsUrl: config.hyperbridgeChain.wsUrl,
      hasher: config.hyperbridgeChain.hasher || 'Keccak',
      consensusStateId: config.hyperbridgeChain.consensusStateId
    });

    // Build chain profiles map
    this.chainProfiles = new Map(
      config.chainProfiles.map(profile => [profile.id, profile])
    );

    // Initialize EVM chains for supported EVM chains
    this.initializeEvmChains(config.chainProfiles);
  }

  private initializeEvmChains(profiles: ChainProfile[]): void {
    for (const profile of profiles) {
      if (profile.chainCategory === 'evm') {
        // Extract chainId from RPC or use a default mapping
        // TODO: Add proper chainId extraction from ChainProfile
        const chainId = this.extractChainId(profile);
        if (chainId) {
          this.evmChains.set(profile.id, new EvmChain({
            chainId,
            rpcUrl: profile.rpcUrl,
            host: 'TODO_HOST_CONTRACT_ADDRESS', // TODO: Get from config
            consensusStateId: `EVM${chainId}`
          }));
        }
      }
    }
  }

  private extractChainId(profile: ChainProfile): number | null {
    // TODO: Extract chainId from profile metadata or RPC
    // For now, return null (placeholder)
    return null;
  }

  async supportsChain(chainId: string): boolean {
    return this.chainProfiles.has(chainId);
  }

  async getBalance(address: string, chainId: string): Promise<string> {
    const profile = this.chainProfiles.get(chainId);
    if (!profile) {
      throw new Error(`Chain ${chainId} not supported by HyperbridgeProvider`);
    }

    try {
      // Connect to Hyperbridge if not already connected
      if (!this.hyperbridgeChain.isConnected) {
        await this.hyperbridgeChain.connect();
      }

      // Get latest block number for the target chain from Hyperbridge
      const latestBlock = await this.getLatestBlockNumber(chainId);

      if (profile.chainCategory === 'evm') {
        return await this.getEvmBalance(address, chainId, latestBlock);
      } else if (profile.chainCategory === 'polkadot-sdk') {
        return await this.getSubstrateBalance(address, chainId, latestBlock);
      } else {
        throw new Error(`Unsupported chain category: ${profile.chainCategory}`);
      }
    } catch (error) {
      throw new Error(`Failed to get balance for ${address} on ${chainId}: ${error}`);
    }
  }

  private async getEvmBalance(
    address: string,
    chainId: string,
    blockNumber: number
  ): Promise<string> {
    const evmChain = this.evmChains.get(chainId);
    if (!evmChain) {
      throw new Error(`EVM chain ${chainId} not initialized`);
    }

    // For EVM, we can use direct RPC call or storage query
    // Using storage query via Hyperbridge for verified state
    // Balance is stored at storage slot: keccak256(address + 0)
    const balanceSlot = this.calculateBalanceSlot(address);
    const keys = [balanceSlot];

    try {
      // Query state proof via Hyperbridge
      const proof = await this.hyperbridgeChain.queryStateProof(blockNumber, keys);
      
      // TODO: Parse proof to extract balance
      // For now, return placeholder
      // In production, decode the proof and extract the balance value
      return '0'; // Placeholder
    } catch (error) {
      // Fallback to direct RPC if Hyperbridge query fails
      return await this.getEvmBalanceDirect(address, chainId);
    }
  }

  private async getSubstrateBalance(
    address: string,
    chainId: string,
    blockNumber: number
  ): Promise<string> {
    // For Substrate chains, query account balance via storage key
    // Storage key format: System::Account(AccountId)
    const storageKey = this.calculateSubstrateAccountKey(address);
    const keys = [storageKey];

    try {
      const proof = await this.hyperbridgeChain.queryStateProof(blockNumber, keys);
      
      // TODO: Parse proof to extract balance
      // For now, return placeholder
      return '0'; // Placeholder
    } catch (error) {
      throw new Error(`Failed to query Substrate balance: ${error}`);
    }
  }

  private async getEvmBalanceDirect(address: string, chainId: string): Promise<string> {
    // Fallback: use direct RPC call via ethers
    const profile = this.chainProfiles.get(chainId);
    if (!profile) {
      throw new Error(`Chain ${chainId} not found`);
    }

    // TODO: Implement direct RPC call using ethers
    // For now, return placeholder
    return '0';
  }

  private async getLatestBlockNumber(chainId: string): Promise<number> {
    // TODO: Query latest block number from Hyperbridge indexer
    // For now, return placeholder
    // Should query: GET /api/chains/{chainId}/latest-block
    return 0;
  }

  private calculateBalanceSlot(address: string): string {
    // EVM balance storage slot calculation
    // Balance is at: keccak256(address + 0)
    // TODO: Implement proper keccak256 hashing
    return `0x${address.slice(2).padStart(64, '0')}`;
  }

  private calculateSubstrateAccountKey(address: string): string {
    // Substrate System::Account storage key
    // TODO: Implement proper storage key calculation
    return address;
  }

  async getNativeTokenSymbol(chainId: string): Promise<string> {
    const profile = this.chainProfiles.get(chainId);
    if (!profile) {
      throw new Error(`Chain ${chainId} not supported`);
    }
    return profile.nativeToken.symbol;
  }
}

