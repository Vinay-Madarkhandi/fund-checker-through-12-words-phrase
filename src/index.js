#!/usr/bin/env node

/**
 * Multi-Chain Wallet Auditor
 *
 * Audits wallet balances across all major blockchains using a seed phrase.
 * Security: All derivations are local. Never exports private keys.
 */

import { Command } from "commander";
import { readFileSync } from "fs";
import readline from "readline";
import { deriveAddresses } from "./derivation.js";
import { checkEVMChains } from "./evm-checker.js";
import { checkSolana } from "./solana-checker.js";
import { checkBitcoin } from "./bitcoin-checker.js";
import { checkSui } from "./sui-checker.js";
import { checkAptos } from "./aptos-checker.js";
import { checkStacks } from "./stacks-checker.js";
import { generateReport } from "./report.js";

const program = new Command();

// Suppress noisy ethers.js warnings about network detection
// These are harmless - ethers retries automatically
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(" ");
  // Filter out all noisy network warnings
  if (
    message.includes("JsonRpcProvider failed to detect network") ||
    message.includes("bigint: Failed to load bindings") ||
    message.includes("retry in") ||
    message.includes("cannot start up") ||
    message.includes("perhaps the URL is wrong")
  ) {
    return; // Suppress these specific warnings
  }
  originalConsoleError.apply(console, args);
};

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         🔐 MULTI-CHAIN WALLET AUDITOR 🔐                     ║
║                                                               ║
║  Audit wallet balances across ALL major blockchains           ║
║  from a single seed phrase                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

/**
 * Prompt user for security confirmation
 */
async function promptSecurityConfirmation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n⚠️  SECURITY WARNING ⚠️\n");
  console.log("This tool will:");
  console.log("  ✓ Read your seed phrase from seed.json");
  console.log("  ✓ Derive wallet addresses locally");
  console.log("  ✓ Query PUBLIC blockchain APIs for balances");
  console.log("  ✓ NEVER send your seed phrase or private keys anywhere");
  console.log("\n🔒 Your seed phrase will ONLY be used for local derivation.");
  console.log("🔒 Private keys are NEVER logged or exported.\n");
  console.log("To proceed, type exactly: I OWN THIS SEED PHRASE\n");

  return new Promise((resolve) => {
    rl.question("> ", (answer) => {
      rl.close();
      if (answer.trim() === "I OWN THIS SEED PHRASE") {
        console.log("\n✅ Confirmation received. Proceeding...\n");
        resolve(true);
      } else {
        console.log("\n❌ Confirmation failed. Exiting for your safety.\n");
        resolve(false);
      }
    });
  });
}

/**
 * Load seed phrase from JSON file
 */
function loadSeedPhrase(filePath) {
  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    if (!data.seed || typeof data.seed !== "string") {
      throw new Error(
        'Invalid seed.json format. Expected { "seed": "your words here" }'
      );
    }

    const words = data.seed.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      throw new Error(
        `Invalid seed phrase length: ${words.length} words. Expected 12 or 24.`
      );
    }

    return data.seed;
  } catch (error) {
    console.error(`❌ Error loading seed phrase: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main audit function
 */
async function auditWallet(options) {
  console.log(banner);

  // Security confirmation
  const confirmed = await promptSecurityConfirmation();
  if (!confirmed) {
    process.exit(0);
  }

  // Load seed phrase
  console.log("📂 Loading seed phrase from seed.json...");
  const seedPhrase = loadSeedPhrase(options.seedFile);
  console.log(`✅ Loaded ${seedPhrase.split(/\s+/).length}-word seed phrase\n`);

  // Derive addresses
  console.log(
    `🔑 Deriving ${options.addresses} addresses for each blockchain...\n`
  );
  const addresses = deriveAddresses(seedPhrase, options.addresses);

  console.log("📋 Derived Addresses Summary:");
  for (const [chain, addrs] of Object.entries(addresses)) {
    console.log(`  ${chain}: ${addrs.length} addresses`);
  }
  console.log("");

  // Initialize results
  const results = {
    checkedAt: new Date().toISOString(),
    derivedAddresses: addresses,
    results: {},
    summary: {
      chainsWithFunds: [],
      totalUsdEstimate: 0,
      errors: [],
    },
  };

  // Check all chains concurrently
  console.log("🔍 Checking balances across all blockchains...\n");
  console.log("─".repeat(70));

  const chainChecks = [
    { name: "EVM Chains", fn: () => checkEVMChains(addresses.evm) },
    { name: "Solana", fn: () => checkSolana(addresses.solana) },
    { name: "Bitcoin", fn: () => checkBitcoin(addresses.bitcoin) },
    { name: "Sui", fn: () => checkSui(addresses.sui) },
    { name: "Aptos", fn: () => checkAptos(addresses.aptos) },
    { name: "Stacks", fn: () => checkStacks(addresses.stacks) },
  ];

  // Execute all checks (with some parallelization control)
  for (const check of chainChecks) {
    try {
      console.log(`\n🔎 Checking ${check.name}...`);
      const chainResult = await check.fn();

      if (chainResult && typeof chainResult === "object") {
        Object.assign(results.results, chainResult);

        // Check if any addresses have funds
        const hasFunds = Object.values(chainResult).some((chainData) => {
          return Object.values(chainData).some((addrData) => {
            if (typeof addrData === "object" && addrData.nativeBalance) {
              return parseFloat(addrData.nativeBalance) > 0;
            }
            return false;
          });
        });

        if (hasFunds) {
          const chainNames = Object.keys(chainResult);
          results.summary.chainsWithFunds.push(...chainNames);
        }
      }

      console.log(`  ✅ ${check.name} check completed`);
    } catch (error) {
      console.error(`  ❌ ${check.name} check failed: ${error.message}`);
      results.summary.errors.push({ chain: check.name, error: error.message });
    }
  }

  console.log("\n" + "─".repeat(70));
  console.log("\n📊 Generating final report...\n");

  // Generate and save report
  await generateReport(results);

  // Print summary
  console.log("═".repeat(70));
  console.log("                        AUDIT SUMMARY");
  console.log("═".repeat(70));
  console.log(`\n⏰ Completed at: ${results.checkedAt}`);
  console.log(
    `💰 Chains with funds: ${results.summary.chainsWithFunds.length || 0}`
  );

  if (results.summary.chainsWithFunds.length > 0) {
    console.log(`\n🎉 FUNDS DETECTED ON:`);
    results.summary.chainsWithFunds.forEach((chain) => {
      console.log(`   • ${chain}`);
    });
  } else {
    console.log("\n💸 No funds detected on any checked addresses.");
  }

  if (results.summary.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${results.summary.errors.length}`);
    results.summary.errors.forEach((err) => {
      console.log(`   • ${err.chain}: ${err.error}`);
    });
  }

  console.log(
    `\n💵 Estimated total USD value: $${results.summary.totalUsdEstimate.toFixed(
      2
    )}`
  );
  console.log("\n📄 Full report saved to: report.json");
  console.log("\n" + "═".repeat(70) + "\n");
}

// CLI Configuration
program
  .name("multi-chain-auditor")
  .description(
    "Audit wallet balances across all major blockchains from a seed phrase"
  )
  .version("1.0.0")
  .option("-s, --seed-file <path>", "Path to seed.json file", "seed.json")
  .option(
    "-a, --addresses <number>",
    "Number of addresses to derive per chain",
    "10"
  )
  .action((options) => {
    options.addresses = parseInt(options.addresses, 10);
    if (
      isNaN(options.addresses) ||
      options.addresses < 1 ||
      options.addresses > 100
    ) {
      console.error(
        "❌ Invalid number of addresses. Must be between 1 and 100."
      );
      process.exit(1);
    }
    auditWallet(options).catch((error) => {
      console.error("\n❌ Fatal error:", error.message);
      console.error(error.stack);
      process.exit(1);
    });
  });

program.parse();
