/**
 * Stacks Balance Checker
 *
 * Checks STX balances on Stacks mainnet
 */

import axios from "axios";

const STACKS_API = "https://api.mainnet.hiro.so";

/**
 * Get STX balance
 */
async function getStacksBalance(address) {
  try {
    const response = await axios.get(
      `${STACKS_API}/extended/v1/address/${address}/balances`,
      { timeout: 10000 }
    );

    if (response.data && response.data.stx) {
      const balance = BigInt(response.data.stx.balance) / BigInt(1000000);
      return {
        balance: balance.toString(),
        locked: (BigInt(response.data.stx.locked) / BigInt(1000000)).toString(),
      };
    }
    return { balance: "0", locked: "0" };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { balance: "0", locked: "0" };
    }
    throw error;
  }
}

/**
 * Check Stacks balances for multiple addresses
 */
export async function checkStacks(addresses) {
  const results = { stacks: {} };

  console.log(`  🟠 Checking Stacks mainnet...`);

  for (const address of addresses) {
    try {
      const { balance, locked } = await getStacksBalance(address);
      const totalBalance = parseFloat(balance) + parseFloat(locked);
      const hasActivity = totalBalance > 0;

      results.stacks[address] = {
        address,
        nativeBalance: balance,
        lockedBalance: locked,
        nativeSymbol: "STX",
        hasActivity,
        usdValue: 0,
      };

      if (hasActivity) {
        console.log(`    💰 ${address}: ${balance} STX (${locked} locked)`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      // Suppress 400 errors (expected with simplified address derivation)
      if (error.response?.status !== 400) {
        console.error(`    ❌ Error checking ${address}: ${error.message}`);
      }
      results.stacks[address] = {
        address,
        nativeBalance: "0",
        nativeSymbol: "STX",
        hasActivity: false,
        error: error.message,
      };
    }
  }

  const withFunds = Object.values(results.stacks).filter(
    (r) => r.hasActivity
  ).length;
  if (withFunds > 0) {
    console.log(`    ✨ Found funds in ${withFunds} address(es)`);
  } else {
    console.log(`    ⚪ No funds found`);
  }

  return results;
}
