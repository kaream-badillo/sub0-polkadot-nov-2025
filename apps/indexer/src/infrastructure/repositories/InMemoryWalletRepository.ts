/**
 * Infrastructure: In-memory implementation of IWalletRepository.
 * This is a temporary solution until persistence layer is added.
 */

import type { WalletTarget } from '@repo/config';
import type { WalletSnapshot } from '../../domain/entities';
import type { IWalletRepository } from '../../domain/repositories/IWalletRepository';

export class InMemoryWalletRepository implements IWalletRepository {
  private wallets: Map<string, WalletTarget> = new Map();
  private snapshots: Map<string, WalletSnapshot[]> = new Map(); // walletId -> snapshots[]

  async addWallet(wallet: WalletTarget): Promise<void> {
    if (this.wallets.has(wallet.id)) {
      throw new Error(`Wallet with id ${wallet.id} already exists`);
    }
    this.wallets.set(wallet.id, wallet);
    this.snapshots.set(wallet.id, []);
  }

  async removeWallet(walletId: string): Promise<void> {
    if (!this.wallets.has(walletId)) {
      throw new Error(`Wallet with id ${walletId} not found`);
    }
    this.wallets.delete(walletId);
    this.snapshots.delete(walletId);
  }

  async getAllWallets(): Promise<WalletTarget[]> {
    return Array.from(this.wallets.values());
  }

  async getWalletById(walletId: string): Promise<WalletTarget | null> {
    return this.wallets.get(walletId) || null;
  }

  async saveSnapshot(snapshot: WalletSnapshot): Promise<void> {
    const history = this.snapshots.get(snapshot.walletId) || [];
    history.push(snapshot);
    // Keep only last 100 snapshots per wallet to prevent memory bloat
    if (history.length > 100) {
      history.shift();
    }
    this.snapshots.set(snapshot.walletId, history);
  }

  async getLatestSnapshot(walletId: string): Promise<WalletSnapshot | null> {
    const history = this.snapshots.get(walletId);
    if (!history || history.length === 0) {
      return null;
    }
    return history[history.length - 1];
  }

  async getSnapshotHistory(walletId: string, limit: number = 50): Promise<WalletSnapshot[]> {
    const history = this.snapshots.get(walletId) || [];
    return history.slice(-limit);
  }
}

