/**
 * Shared configuration primitives for Cross-Chain Treasury Monitor.
 * Derived from the requirements in `cursor/project-context.md`.
 */

export type ChainCategory = 'polkadot-sdk' | 'evm' | 'other';

export interface ChainProfile {
  id: string;
  name: string;
  rpcUrl: string;
  explorerUrl?: string;
  chainCategory: ChainCategory;
  nativeToken: {
    symbol: string;
    decimals: number;
  };
  notes?: string;
}

export interface WalletTarget {
  id: string;
  label: string;
  address: string;
  chainId: ChainProfile['id'];
  tags: string[];
  importance: 'core-treasury' | 'ops' | 'watchlist';
  metadata?: Record<string, string | number | boolean>;
}

export type AlertType = 'balance-drop' | 'balance-increase' | 'large-tx' | 'custom';

export interface AlertRule {
  id: string;
  walletId: WalletTarget['id'];
  type: AlertType;
  direction: 'above' | 'below';
  threshold: number;
  windowMinutes: number;
  enabled: boolean;
  channel: 'in-app' | 'webhook' | 'email';
}

/**
 * Example Chain Profiles
 * Replace the TODO_ placeholders with real RPC endpoints and explorers.
 */
export const chainProfiles: ChainProfile[] = [
  {
    id: 'polkadot-relay',
    name: 'Polkadot Relay Chain',
    rpcUrl: 'TODO_POLKADOT_RPC_URL',
    explorerUrl: 'TODO_POLKADOT_EXPLORER',
    chainCategory: 'polkadot-sdk',
    nativeToken: { symbol: 'DOT', decimals: 10 },
    notes: 'Relay chain used for treasury snapshots and Hyperbridge queries.'
  },
  {
    id: 'lisk-testnet',
    name: 'Lisk Testnet',
    rpcUrl: 'TODO_LISK_TESTNET_RPC_URL',
    explorerUrl: 'TODO_LISK_TESTNET_EXPLORER',
    chainCategory: 'evm',
    nativeToken: { symbol: 'tLSK', decimals: 18 },
    notes: 'Primary network for MVP badge minting workflow.'
  }
];

/**
 * Example wallet targets that map to the chain profiles above.
 */
export const walletTargets: WalletTarget[] = [
  {
    id: 'treasury-polkadot-core',
    label: 'Main Treasury Multisig',
    address: 'TODO_DOT_TREASURY_ADDR',
    chainId: 'polkadot-relay',
    tags: ['treasury', 'core'],
    importance: 'core-treasury',
    metadata: {
      contact: 'TODO_OWNER_PGP',
      description: 'Official treasury follow set extracted from project-context.'
    }
  },
  {
    id: 'ops-lisk-pilot',
    label: 'Lisk Pilot Wallet',
    address: 'TODO_LISK_WALLET_ADDR',
    chainId: 'lisk-testnet',
    tags: ['ops', 'badge'],
    importance: 'ops',
    metadata: {
      purpose: 'MVP badge minting on Lisk testnet',
      reviewer: 'TODO_OWNER_NAME'
    }
  }
];

/**
 * Example alert rules to highlight key treasury movements.
 */
export const alertRules: AlertRule[] = [
  {
    id: 'alert-large-outgoing-dot',
    walletId: 'treasury-polkadot-core',
    type: 'balance-drop',
    direction: 'below',
    threshold: 10_000,
    windowMinutes: 15,
    enabled: true,
    channel: 'webhook'
  },
  {
    id: 'alert-lisk-minting',
    walletId: 'ops-lisk-pilot',
    type: 'large-tx',
    direction: 'above',
    threshold: 5,
    windowMinutes: 5,
    enabled: true,
    channel: 'in-app'
  }
];

/**
 * Lightweight helper to merge external configuration at runtime.
 * Example usage:
 * ```ts
 * extendConfig({ chainProfiles: [...], walletTargets: [...] });
 * ```
 */
export function extendConfig(partial: {
  chainProfiles?: ChainProfile[];
  walletTargets?: WalletTarget[];
  alertRules?: AlertRule[];
}): {
  chainProfiles: ChainProfile[];
  walletTargets: WalletTarget[];
  alertRules: AlertRule[];
} {
  return {
    chainProfiles: partial.chainProfiles
      ? [...chainProfiles, ...partial.chainProfiles]
      : chainProfiles,
    walletTargets: partial.walletTargets
      ? [...walletTargets, ...partial.walletTargets]
      : walletTargets,
    alertRules: partial.alertRules ? [...alertRules, ...partial.alertRules] : alertRules
  };
}

