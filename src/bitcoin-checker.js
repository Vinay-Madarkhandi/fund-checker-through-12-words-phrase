/**
 * Bitcoin Balance Checker
 *
 * Checks BTC balances using public blockchain APIs
 */

import axios from "axios";

// Bitcoin API endpoints
const BTC_APIS = {
  blockstream: "https://blockstream.info/api",
  blockchain: "https://blockchain.info",
  mempool: "https://mempool.space/api",
};

/**
 * Retry wrapper for API calls
 */
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

/**
 * Get BTC balance using Blockstream API
 */
async function getBalanceBlockstream(address) {
  const response = await axios.get(
    `${BTC_APIS.blockstream}/address/${address}`,
    { timeout: 10000 }
  );

  const data = response.data;
  const balance =
    (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) /
    100000000; // Convert satoshis to BTC

  return {
    balance: balance.toString(),
    transactions: data.chain_stats.tx_count,
  };
}

/**
 * Get BTC balance using Mempool.space API (fallback)
 */
async function getBalanceMempool(address) {
  const response = await axios.get(`${BTC_APIS.mempool}/address/${address}`, {
    timeout: 10000,
  });

  const data = response.data;
  const balance =
    (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) /
    100000000;

  return {
    balance: balance.toString(),
    transactions: data.chain_stats.tx_count,
  };
}

/**
 * Get BTC balance with fallback APIs
 */
async function getBTCBalance(address) {
  try {
    return await retryRequest(() => getBalanceBlockstream(address));
  } catch (error) {
    console.error(`    ⚠️  Blockstream API failed, trying Mempool.space...`);
    try {
      return await retryRequest(() => getBalanceMempool(address));
    } catch (fallbackError) {
      throw new Error("All Bitcoin APIs failed");
    }
  }
}

/**
 * Check Bitcoin balances for multiple addresses
 */
export async function checkBitcoin(addresses) {
  const results = { bitcoin: {} };

  console.log(`  🟠 Checking Bitcoin mainnet...`);

  for (const address of addresses) {
    try {
      const { balance, transactions } = await getBTCBalance(address);
      const hasActivity = parseFloat(balance) > 0 || transactions > 0;

      results.bitcoin[address] = {
        address,
        nativeBalance: balance,
        nativeSymbol: "BTC",
        transactions,
        hasActivity,
        usdValue: 0, // Would calculate with price API
      };

      if (hasActivity) {
        console.log(`    💰 ${address}: ${balance} BTC (${transactions} txs)`);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`    ❌ Error checking ${address}: ${error.message}`);
      results.bitcoin[address] = {
        address,
        nativeBalance: "0",
        nativeSymbol: "BTC",
        hasActivity: false,
        error: error.message,
      };
    }
  }

  const withFunds = Object.values(results.bitcoin).filter(
    (r) => r.hasActivity
  ).length;
  if (withFunds > 0) {
    console.log(`    ✨ Found funds in ${withFunds} address(es)`);
  } else {
    console.log(`    ⚪ No funds found`);
  }

  return results;
}
