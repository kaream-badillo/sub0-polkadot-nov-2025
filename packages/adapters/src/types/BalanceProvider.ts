/**
 * BalanceProvider Interface
 * Common interface for querying wallet balances across different blockchain networks.
 */

export interface BalanceProvider {
  /**
   * Get the current balance of a wallet address on a specific chain.
   * @param address - Wallet address to query
   * @param chainId - Chain identifier (from ChainProfile.id)
   * @returns Balance as a string (in wei/smallest unit, to preserve precision)
   */
  getBalance(address: string, chainId: string): Promise<string>;

  /**
   * Check if this provider supports a specific chain.
   * @param chainId - Chain identifier to check
   * @returns true if the chain is supported
   */
  supportsChain(chainId: string): boolean;

  /**
   * Get the native token symbol for a chain (e.g., "DOT", "ETH").
   * @param chainId - Chain identifier
   * @returns Token symbol
   */
  getNativeTokenSymbol(chainId: string): Promise<string>;
}

