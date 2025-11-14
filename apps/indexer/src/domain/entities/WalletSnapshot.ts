/**
 * Domain entity: WalletSnapshot
 * Represents a point-in-time snapshot of a wallet's balance and state.
 */

import type { WalletTarget } from '@repo/config';

export interface WalletSnapshot {
  walletId: WalletTarget['id'];
  chainId: string;
  balance: string; // BigInt as string to avoid precision loss
  timestamp: number; // Unix timestamp in milliseconds
  blockNumber?: number;
  txHash?: string; // Last transaction hash if available
}

export interface WalletSnapshotDelta {
  walletId: WalletTarget['id'];
  previousBalance: string;
  currentBalance: string;
  delta: string; // Signed difference
  percentageChange: number;
  timestamp: number;
}

