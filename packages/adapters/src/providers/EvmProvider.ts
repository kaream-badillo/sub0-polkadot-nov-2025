/**
 * EvmProvider
 * Direct RPC provider for EVM chains (Ethereum, BSC, Polygon, etc.).
 * Uses ethers.js for direct balance queries.
 */

import type { BalanceProvider } from '../types/BalanceProvider';
import type { ChainProfile } from '@repo/config';
import { ethers } from 'ethers';

export interface EvmProviderConfig {
  /** Chain profiles to support */
  chainProfiles: ChainProfile[];
}

export class EvmProvider implements BalanceProvider {
  private chainProfiles: Map<string, ChainProfile>;
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  constructor(config: EvmProviderConfig) {
    this.chainProfiles = new Map(
      config.chainProfiles.map(profile => [profile.id, profile])
    );

    // Initialize providers for each EVM chain
    this.initializeProviders(config.chainProfiles);
  }

  private initializeProviders(profiles: ChainProfile[]): void {
    for (const profile of profiles) {
      if (profile.chainCategory === 'evm') {
        try {
          const provider = new ethers.JsonRpcProvider(profile.rpcUrl);
          this.providers.set(profile.id, provider);
        } catch (error) {
          console.warn(`Failed to initialize provider for ${profile.id}:`, error);
        }
      }
    }
  }

  async supportsChain(chainId: string): boolean {
    const profile = this.chainProfiles.get(chainId);
    return profile?.chainCategory === 'evm';
  }

  async getBalance(address: string, chainId: string): Promise<string> {
    const profile = this.chainProfiles.get(chainId);
    if (!profile) {
      throw new Error(`Chain ${chainId} not supported by EvmProvider`);
    }

    if (profile.chainCategory !== 'evm') {
      throw new Error(`Chain ${chainId} is not an EVM chain`);
    }

    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`Provider not initialized for chain ${chainId}`);
    }

    try {
      // Validate address format
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid EVM address: ${address}`);
      }

      // Query balance directly via RPC
      const balance = await provider.getBalance(address);
      
      // Return balance as string (in wei)
      return balance.toString();
    } catch (error) {
      throw new Error(`Failed to get balance for ${address} on ${chainId}: ${error}`);
    }
  }

  async getNativeTokenSymbol(chainId: string): Promise<string> {
    const profile = this.chainProfiles.get(chainId);
    if (!profile) {
      throw new Error(`Chain ${chainId} not supported`);
    }
    return profile.nativeToken.symbol;
  }
}

