/**
 * Domain repository interface for wallet management.
 * Infrastructure layer will implement this interface.
 */

import type { WalletTarget } from '@repo/config';
import type { WalletSnapshot } from '../entities';

export interface IWalletRepository {
  /**
   * Register a new wallet target for monitoring.
   */
  addWallet(wallet: WalletTarget): Promise<void>;

  /**
   * Remove a wallet from monitoring.
   */
  removeWallet(walletId: string): Promise<void>;

  /**
   * Get all registered wallets.
   */
  getAllWallets(): Promise<WalletTarget[]>;

  /**
   * Get a specific wallet by ID.
   */
  getWalletById(walletId: string): Promise<WalletTarget | null>;

  /**
   * Save a snapshot for a wallet.
   */
  saveSnapshot(snapshot: WalletSnapshot): Promise<void>;

  /**
   * Get the latest snapshot for a wallet.
   */
  getLatestSnapshot(walletId: string): Promise<WalletSnapshot | null>;

  /**
   * Get snapshot history for a wallet (with optional limit).
   */
  getSnapshotHistory(walletId: string, limit?: number): Promise<WalletSnapshot[]>;
}

