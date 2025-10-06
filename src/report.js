/**
 * Report Generator
 *
 * Generates comprehensive JSON report with balance summary
 */

import { writeFileSync } from "fs";
import axios from "axios";

/**
 * Get cryptocurrency prices from CoinGecko
 */
async function getCryptoPrices() {
  try {
    const coins = [
      "ethereum",
      "binancecoin",
      "matic-network",
      "avalanche-2",
      "bitcoin",
      "solana",
      "aptos",
      "sui",
      "tron",
      "cardano",
      "cosmos",
      "polkadot",
      "stacks",
    ];

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(
        ","
      )}&vs_currencies=usd`,
      { timeout: 10000 }
    );

    return {
      ETH: response.data.ethereum?.usd || 0,
      BNB: response.data.binancecoin?.usd || 0,
      MATIC: response.data["matic-network"]?.usd || 0,
      AVAX: response.data["avalanche-2"]?.usd || 0,
      BTC: response.data.bitcoin?.usd || 0,
      SOL: response.data.solana?.usd || 0,
      APT: response.data.aptos?.usd || 0,
      SUI: response.data.sui?.usd || 0,
      TRX: response.data.tron?.usd || 0,
      ADA: response.data.cardano?.usd || 0,
      ATOM: response.data.cosmos?.usd || 0,
      DOT: response.data.polkadot?.usd || 0,
      STX: response.data.stacks?.usd || 0,
      FTM: 0, // Fantom might not be available
    };
  } catch (error) {
    console.error("  ⚠️  Could not fetch crypto prices from CoinGecko");
    return {};
  }
}

/**
 * Calculate USD values for all balances
 */
function calculateUSDValues(results, prices) {
  let totalUsd = 0;

  for (const [chain, addresses] of Object.entries(results)) {
    for (const [address, data] of Object.entries(addresses)) {
      if (data.nativeBalance && data.nativeSymbol) {
        const balance = parseFloat(data.nativeBalance);
        const price = prices[data.nativeSymbol] || 0;
        const usdValue = balance * price;

        data.usdValue = usdValue;
        totalUsd += usdValue;
      }
    }
  }

  return totalUsd;
}

/**
 * Generate summary statistics
 */
function generateSummary(results) {
  const summary = {
    totalAddressesChecked: 0,
    addressesWithFunds: 0,
    chainsChecked: Object.keys(results).length,
    chainsWithFunds: [],
    totalUsdEstimate: 0,
    balancesByChain: {},
    errors: [],
  };

  for (const [chain, addresses] of Object.entries(results)) {
    let chainTotal = 0;
    let chainAddressesWithFunds = 0;

    for (const [address, data] of Object.entries(addresses)) {
      summary.totalAddressesChecked++;

      if (data.hasActivity) {
        summary.addressesWithFunds++;
        chainAddressesWithFunds++;

        if (data.usdValue) {
          chainTotal += data.usdValue;
        }
      }

      if (data.error) {
        summary.errors.push({
          chain,
          address,
          error: data.error,
        });
      }
    }

    if (chainAddressesWithFunds > 0) {
      summary.chainsWithFunds.push(chain);
      summary.balancesByChain[chain] = {
        addressesWithFunds: chainAddressesWithFunds,
        totalUsdValue: chainTotal,
      };
    }
  }

  return summary;
}

/**
 * Format report with nice structure (COMPACT VERSION - only addresses with balances)
 */
function formatReport(data) {
  // Filter to only include addresses with activity
  const filteredBalances = {};

  for (const [chain, addresses] of Object.entries(data.results)) {
    const activeAddresses = {};

    for (const [address, info] of Object.entries(addresses)) {
      if (info.hasActivity && parseFloat(info.nativeBalance || 0) > 0) {
        activeAddresses[address] = info;
      }
    }

    // Only include chain if it has addresses with funds
    if (Object.keys(activeAddresses).length > 0) {
      filteredBalances[chain] = activeAddresses;
    }
  }

  const report = {
    metadata: {
      generatedAt: data.checkedAt,
      version: "1.0.0",
      tool: "multi-chain-wallet-auditor",
      note: "This report only includes addresses with balances. All empty addresses have been filtered out for brevity.",
    },
    summary: data.summary,
    addressesWithFunds: filteredBalances,
  };

  return report;
}

/**
 * Main report generation function
 */
export async function generateReport(data) {
  console.log("  💱 Fetching cryptocurrency prices...");

  // Get current prices
  const prices = await getCryptoPrices();

  console.log("  💰 Calculating USD values...");

  // Calculate USD values
  const totalUsd = calculateUSDValues(data.results, prices);

  // Generate summary
  const summary = generateSummary(data.results);
  summary.totalUsdEstimate = totalUsd;

  // Update data with summary
  data.summary = summary;

  // Format final report
  const report = formatReport(data);

  // Save to file
  const filename = "report.json";
  writeFileSync(filename, JSON.stringify(report, null, 2), "utf-8");

  console.log(`  ✅ Report saved to ${filename}`);

  // Also create a human-readable summary
  const summaryFilename = "report-summary.txt";
  const summaryText = generateTextSummary(report);
  writeFileSync(summaryFilename, summaryText, "utf-8");

  console.log(`  ✅ Summary saved to ${summaryFilename}`);

  return report;
}

/**
 * Generate human-readable text summary
 */
function generateTextSummary(report) {
  const { summary, metadata } = report;

  let text = "";
  text += "═══════════════════════════════════════════════════════════\n";
  text += "          MULTI-CHAIN WALLET AUDIT SUMMARY\n";
  text += "═══════════════════════════════════════════════════════════\n\n";
  text += `Generated: ${metadata.generatedAt}\n\n`;

  text += "SCAN STATISTICS\n";
  text += "─────────────────────────────────────────────────────────\n";
  text += `Total Addresses Checked: ${summary.totalAddressesChecked}\n`;
  text += `Addresses with Funds: ${summary.addressesWithFunds}\n`;
  text += `Chains Checked: ${summary.chainsChecked}\n`;
  text += `Chains with Funds: ${summary.chainsWithFunds.length}\n\n`;

  if (summary.chainsWithFunds.length > 0) {
    text += "FUNDS DETECTED ON\n";
    text += "─────────────────────────────────────────────────────────\n";

    for (const chain of summary.chainsWithFunds) {
      const chainData = summary.balancesByChain[chain];
      text += `• ${chain.toUpperCase()}\n`;
      text += `  Addresses: ${chainData.addressesWithFunds}\n`;
      text += `  USD Value: $${chainData.totalUsdValue.toFixed(2)}\n\n`;
    }
  } else {
    text += "NO FUNDS DETECTED\n";
    text += "─────────────────────────────────────────────────────────\n";
    text += "No balances found on any of the checked addresses.\n\n";
  }

  text += "TOTAL ESTIMATED VALUE\n";
  text += "─────────────────────────────────────────────────────────\n";
  text += `$${summary.totalUsdEstimate.toFixed(2)} USD\n\n`;

  if (summary.errors.length > 0) {
    text += "ERRORS ENCOUNTERED\n";
    text += "─────────────────────────────────────────────────────────\n";
    summary.errors.slice(0, 10).forEach((err) => {
      text += `• ${err.chain}: ${err.error}\n`;
    });
    if (summary.errors.length > 10) {
      text += `... and ${summary.errors.length - 10} more errors\n`;
    }
    text += "\n";
  }

  text += "═══════════════════════════════════════════════════════════\n";
  text += "See report.json for complete details\n";
  text += "═══════════════════════════════════════════════════════════\n";

  return text;
}
