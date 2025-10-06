/**
 * Sui Balance Checker
 *
 * Checks SUI balances and coin holdings on Sui network
 */

import axios from "axios";

const SUI_RPC = "https://fullnode.mainnet.sui.io:443";

/**
 * Check SUI and ALL tokens using RPC
 */
async function getSuiBalances(address) {
  try {
    // Use suix_getAllBalances to get ALL coin types, not just SUI
    const response = await axios.post(
      SUI_RPC,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "suix_getAllBalances",
        params: [address],
      },
      { timeout: 15000 }
    );

    if (response.data.result) {
      const balances = response.data.result;
      const tokens = [];
      let nativeBalance = "0";

      // Parse all coin balances
      for (const coin of balances) {
        const balance = BigInt(coin.totalBalance) / BigInt(1000000000); // 9 decimals
        const balanceStr = balance.toString();

        if (
          coin.coinType === "0x2::sui::SUI" ||
          coin.coinType.includes("::sui::SUI")
        ) {
          nativeBalance = balanceStr;
        } else {
          // Other tokens
          tokens.push({
            coinType: coin.coinType,
            balance: balanceStr,
            totalBalance: coin.totalBalance,
          });
        }
      }

      return { nativeBalance, tokens };
    }
    return { nativeBalance: "0", tokens: [] };
  } catch (error) {
    throw new Error(`Sui RPC error: ${error.message}`);
  }
}

/**
 * Check Sui balances for multiple addresses
 */
export async function checkSui(addresses) {
  const results = { sui: {} };

  console.log(`  🔵 Checking Sui mainnet...`);
  console.log(
    `  📋 Scanning ${addresses.length} addresses for ALL Sui tokens...`
  );

  for (const address of addresses) {
    try {
      const { nativeBalance, tokens } = await getSuiBalances(address);
      const hasActivity = parseFloat(nativeBalance) > 0 || tokens.length > 0;

      results.sui[address] = {
        address,
        nativeBalance,
        nativeSymbol: "SUI",
        tokens,
        hasActivity,
        usdValue: 0,
      };

      if (hasActivity) {
        console.log(`    💰 ${address}: ${nativeBalance} SUI`);
        if (tokens.length > 0) {
          console.log(`    🪙 Found ${tokens.length} additional token(s)`);
          tokens.slice(0, 3).forEach((token) => {
            const shortType = token.coinType.slice(0, 20) + "...";
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
      results.sui[address] = {
        address,
        nativeBalance: "0",
        nativeSymbol: "SUI",
        tokens: [],
        hasActivity: false,
        error: error.message,
      };
    }
  }

  const withFunds = Object.values(results.sui).filter(
    (r) => r.hasActivity
  ).length;
  if (withFunds > 0) {
    console.log(`    ✨ Found funds in ${withFunds} address(es)`);
  } else {
    console.log(`    ⚪ No funds found`);
  }

  return results;
}
