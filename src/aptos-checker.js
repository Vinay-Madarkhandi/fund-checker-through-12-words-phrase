/**
 * Aptos Balance Checker
 *
 * Checks APT balances on Aptos mainnet
 */

import axios from "axios";

const APTOS_RPC = "https://fullnode.mainnet.aptoslabs.com/v1";

/**
 * Get APT balance and all coin resources
 */
async function getAptosBalances(address) {
  try {
    // Get all resources to find all coin stores
    const response = await axios.get(
      `${APTOS_RPC}/accounts/${address}/resources`,
      { timeout: 10000 }
    );

    const resources = response.data;
    let nativeBalance = "0";
    const tokens = [];

    for (const resource of resources) {
      // Check if this is a CoinStore
      if (resource.type.startsWith("0x1::coin::CoinStore<")) {
        const coinType = resource.type.match(/CoinStore<(.+)>/)[1];
        const balance = resource.data.coin.value;

        if (coinType === "0x1::aptos_coin::AptosCoin") {
          // Native APT
          nativeBalance = (BigInt(balance) / BigInt(100000000)).toString();
        } else {
          // Other tokens
          tokens.push({
            coinType,
            balance: balance,
            decimals: 8, // Default, would need registry for accurate decimals
          });
        }
      }
    }

    return { nativeBalance, tokens };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { nativeBalance: "0", tokens: [] }; // Account doesn't exist
    }
    throw error;
  }
}

export async function checkAptos(addresses) {
  const results = { aptos: {} };

  console.log(`  🔴 Checking Aptos mainnet...`);
  console.log(
    `  📋 Scanning ${addresses.length} addresses for ALL Aptos tokens...`
  );

  for (const address of addresses) {
    try {
      const { nativeBalance, tokens } = await getAptosBalances(address);
      const hasActivity = parseFloat(nativeBalance) > 0 || tokens.length > 0;

      results.aptos[address] = {
        address,
        nativeBalance,
        nativeSymbol: "APT",
        tokens,
        hasActivity,
        usdValue: 0,
      };

      if (hasActivity) {
        console.log(`    💰 ${address}: ${nativeBalance} APT`);
        if (tokens.length > 0) {
          console.log(`    🪙 Found ${tokens.length} additional token(s)`);
          tokens.slice(0, 3).forEach((token) => {
            const shortType = token.coinType.slice(0, 30) + "...";
            console.log(`       • ${shortType}: ${token.balance}`);
          });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    } catch (error) {
      console.error(
        `    ❌ Error checking ${address.slice(
          0,
          10
        )}...: ${error.message.slice(0, 50)}`
      );
      results.aptos[address] = {
        address,
        nativeBalance: "0",
        nativeSymbol: "APT",
        tokens: [],
        hasActivity: false,
        error: error.message,
      };
    }
  }

  const withFunds = Object.values(results.aptos).filter(
    (r) => r.hasActivity
  ).length;
  if (withFunds > 0) {
    console.log(`    ✨ Found funds in ${withFunds} address(es)`);
  } else {
    console.log(`    ⚪ No funds found`);
  }

  return results;
}
