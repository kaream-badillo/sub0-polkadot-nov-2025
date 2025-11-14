/**
 * Application Service: WalletIndexerService
 * Orchestrates wallet monitoring and snapshot creation.
 * Future: will integrate with BalanceProvider adapters from packages/adapters.
 */

import type { WalletTarget } from '@repo/config';
import type { WalletSnapshot } from '../../domain/entities';
import type { IWalletRepository } from '../../domain/repositories/IWalletRepository';

export interface BalanceProvider {
  // Placeholder for future adapter integration
  getBalance(address: string, chainId: string): Promise<string>;
}

export class WalletIndexerService {
  constructor(
    private walletRepository: IWalletRepository,
    private balanceProvider?: BalanceProvider
  ) {}

  /**
   * Register a new wallet for monitoring.
   */
  async registerWallet(wallet: WalletTarget): Promise<void> {
    await this.walletRepository.addWallet(wallet);
  }

  /**
   * Unregister a wallet from monitoring.
   */
  async unregisterWallet(walletId: string): Promise<void> {
    await this.walletRepository.removeWallet(walletId);
  }

  /**
   * Get all monitored wallets.
   */
  async getAllWallets(): Promise<WalletTarget[]> {
    return this.walletRepository.getAllWallets();
  }

  /**
   * Create a snapshot for a specific wallet.
   * Future: will use BalanceProvider to fetch real balance.
   */
  async createSnapshot(walletId: string): Promise<WalletSnapshot> {
    const wallet = await this.walletRepository.getWalletById(walletId);
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    // TODO: Replace with real balance fetch via BalanceProvider
    const balance = this.balanceProvider
      ? await this.balanceProvider.getBalance(wallet.address, wallet.chainId)
      : '0';

    const snapshot: WalletSnapshot = {
      walletId: wallet.id,
      chainId: wallet.chainId,
      balance,
      timestamp: Date.now()
    };

    await this.walletRepository.saveSnapshot(snapshot);
    return snapshot;
  }

  /**
   * Sync all registered wallets (create snapshots for each).
   */
  async syncAllWallets(): Promise<WalletSnapshot[]> {
    const wallets = await this.walletRepository.getAllWallets();
    const snapshots: WalletSnapshot[] = [];

    for (const wallet of wallets) {
      try {
        const snapshot = await this.createSnapshot(wallet.id);
        snapshots.push(snapshot);
      } catch (error) {
        console.error(`Failed to sync wallet ${wallet.id}:`, error);
      }
    }

    return snapshots;
  }

  /**
   * Get snapshot history for a wallet.
   */
  async getWalletHistory(walletId: string, limit?: number): Promise<WalletSnapshot[]> {
    return this.walletRepository.getSnapshotHistory(walletId, limit);
  }

  /**
   * Get the latest snapshot for a wallet.
   */
  async getLatestSnapshot(walletId: string): Promise<WalletSnapshot | null> {
    return this.walletRepository.getLatestSnapshot(walletId);
  }
}

