/**
 * Application Service: WalletIndexerService
 * Orchestrates wallet monitoring and snapshot creation with periodic sync jobs.
 * Integrates with BalanceProvider adapters from packages/adapters.
 */

import { EventEmitter } from 'events';
import type { WalletTarget, AlertRule } from '@repo/config';
import type { WalletSnapshot, WalletSnapshotDelta } from '../../domain/entities';
import type { IWalletRepository } from '../../domain/repositories/IWalletRepository';
import type { BalanceProvider } from '@repo/adapters';

export interface IndexerServiceConfig {
  /** Sync interval in milliseconds (default: 60000 = 1 minute) */
  syncIntervalMs?: number;
  /** Default threshold for significant movements (percentage, default: 5) */
  defaultThresholdPercent?: number;
  /** Minimum absolute change to consider significant (default: 0) */
  minAbsoluteChange?: string;
  /** Alert rules for detecting movements */
  alertRules?: AlertRule[];
}

export interface SignificantMovementEvent {
  walletId: string;
  delta: WalletSnapshotDelta;
  alertRule?: AlertRule;
}

/**
 * WalletIndexerService
 * Orchestrates wallet monitoring, periodic syncing, and movement detection.
 */
export class WalletIndexerService extends EventEmitter {
  private syncTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(
    private walletRepository: IWalletRepository,
    private balanceProvider?: BalanceProvider,
    private config: IndexerServiceConfig = {}
  ) {
    super();
  }

  /**
   * Register a new wallet for monitoring.
   */
  async registerWallet(wallet: WalletTarget): Promise<void> {
    await this.walletRepository.addWallet(wallet);
    this.emit('wallet:registered', { walletId: wallet.id, wallet });
  }

  /**
   * Unregister a wallet from monitoring.
   */
  async unregisterWallet(walletId: string): Promise<void> {
    await this.walletRepository.removeWallet(walletId);
    this.emit('wallet:unregistered', { walletId });
  }

  /**
   * Get all monitored wallets.
   */
  async getAllWallets(): Promise<WalletTarget[]> {
    return this.walletRepository.getAllWallets();
  }

  /**
   * Create a snapshot for a specific wallet using BalanceProvider.
   */
  async createSnapshot(walletId: string): Promise<WalletSnapshot> {
    const wallet = await this.walletRepository.getWalletById(walletId);
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    if (!this.balanceProvider) {
      throw new Error('BalanceProvider not configured');
    }

    try {
      // Fetch balance using BalanceProvider
      const balance = await this.balanceProvider.getBalance(wallet.address, wallet.chainId);

      const snapshot: WalletSnapshot = {
        walletId: wallet.id,
        chainId: wallet.chainId,
        balance,
        timestamp: Date.now()
      };

      await this.walletRepository.saveSnapshot(snapshot);

      // Check for significant movements
      await this.checkSignificantMovement(walletId, snapshot);

      return snapshot;
    } catch (error) {
      this.emit('snapshot:error', { walletId, error });
      throw error;
    }
  }

  /**
   * Sync all registered wallets (create snapshots for each).
   */
  async syncAllWallets(): Promise<WalletSnapshot[]> {
    const wallets = await this.walletRepository.getAllWallets();
    const snapshots: WalletSnapshot[] = [];

    this.emit('sync:start', { walletCount: wallets.length });

    for (const wallet of wallets) {
      try {
        const snapshot = await this.createSnapshot(wallet.id);
        snapshots.push(snapshot);
        this.emit('snapshot:created', { walletId: wallet.id, snapshot });
      } catch (error) {
        console.error(`Failed to sync wallet ${wallet.id}:`, error);
        this.emit('snapshot:error', { walletId: wallet.id, error });
      }
    }

    this.emit('sync:complete', { snapshotCount: snapshots.length });
    return snapshots;
  }

  /**
   * Check for significant movements by comparing current snapshot with previous one.
   */
  private async checkSignificantMovement(
    walletId: string,
    currentSnapshot: WalletSnapshot
  ): Promise<void> {
    const previousSnapshot = await this.walletRepository.getLatestSnapshot(walletId);
    if (!previousSnapshot || previousSnapshot.walletId !== currentSnapshot.walletId) {
      // First snapshot or wallet changed, skip movement check
      return;
    }

    const currentBalance = BigInt(currentSnapshot.balance);
    const previousBalance = BigInt(previousSnapshot.balance);

    if (currentBalance === previousBalance) {
      // No change
      return;
    }

    const delta = currentBalance - previousBalance;
    const deltaString = delta.toString();
    const percentageChange = this.calculatePercentageChange(previousBalance, currentBalance);

    const movementDelta: WalletSnapshotDelta = {
      walletId,
      previousBalance: previousSnapshot.balance,
      currentBalance: currentSnapshot.balance,
      delta: deltaString,
      percentageChange,
      timestamp: currentSnapshot.timestamp
    };

    // Check against default threshold
    const defaultThreshold = this.config.defaultThresholdPercent || 5;
    const minAbsoluteChange = BigInt(this.config.minAbsoluteChange || '0');

    const isSignificant =
      Math.abs(percentageChange) >= defaultThreshold ||
      (delta < 0n && -delta >= minAbsoluteChange) ||
      (delta > 0n && delta >= minAbsoluteChange);

    if (isSignificant) {
      // Check against alert rules
      const matchingAlertRule = this.findMatchingAlertRule(walletId, movementDelta);

      const event: SignificantMovementEvent = {
        walletId,
        delta: movementDelta,
        alertRule: matchingAlertRule
      };

      this.emit('movement:significant', event);

      if (matchingAlertRule && matchingAlertRule.enabled) {
        this.emit('alert:triggered', { walletId, alertRule: matchingAlertRule, delta: movementDelta });
      }
    }
  }

  /**
   * Calculate percentage change between two balances.
   */
  private calculatePercentageChange(previous: bigint, current: bigint): number {
    if (previous === 0n) {
      return current > 0n ? 100 : 0;
    }
    const diff = current - previous;
    return Number((diff * 10000n) / previous) / 100; // 2 decimal places
  }

  /**
   * Find matching alert rule for a movement.
   */
  private findMatchingAlertRule(
    walletId: string,
    delta: WalletSnapshotDelta
  ): AlertRule | undefined {
    if (!this.config.alertRules) {
      return undefined;
    }

    return this.config.alertRules.find(rule => {
      if (!rule.enabled || rule.walletId !== walletId) {
        return false;
      }

      const deltaBigInt = BigInt(delta.delta);
      const thresholdBigInt = BigInt(rule.threshold);

      switch (rule.type) {
        case 'balance-drop':
          if (rule.direction === 'below') {
            return deltaBigInt < 0n && -deltaBigInt >= thresholdBigInt;
          }
          return false;

        case 'balance-increase':
          if (rule.direction === 'above') {
            return deltaBigInt > 0n && deltaBigInt >= thresholdBigInt;
          }
          return false;

        case 'large-tx':
          return Math.abs(deltaBigInt) >= thresholdBigInt;

        default:
          return false;
      }
    });
  }

  /**
   * Start periodic sync job.
   */
  startPeriodicSync(intervalMs?: number): void {
    if (this.isRunning) {
      console.warn('Periodic sync is already running');
      return;
    }

    const syncInterval = intervalMs || this.config.syncIntervalMs || 60000; // Default 1 minute

    this.isRunning = true;
    this.emit('sync:started', { intervalMs: syncInterval });

    // Run initial sync immediately
    this.syncAllWallets().catch(error => {
      this.emit('sync:error', { error });
    });

    // Set up periodic sync
    this.syncTimer = setInterval(() => {
      this.syncAllWallets().catch(error => {
        this.emit('sync:error', { error });
      });
    }, syncInterval);
  }

  /**
   * Stop periodic sync job.
   */
  stopPeriodicSync(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    this.isRunning = false;
    this.emit('sync:stopped');
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
