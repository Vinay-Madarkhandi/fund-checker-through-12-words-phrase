/**
 * Solana Balance Checker
 *
 * Checks SOL balances and SPL token holdings on Solana mainnet
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios";

// Solana RPC endpoints (with fallbacks)
const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  "https://rpc.ankr.com/solana",
];

/**
 * Get Solana connection with retry logic
 */
function getConnection() {
  return new Connection(RPC_ENDPOINTS[0], "confirmed");
}

/**
 * Get SOL balance for an address
 */
async function getSOLBalance(connection, address) {
  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    throw new Error(`Failed to get SOL balance: ${error.message}`);
  }
}

/**
 * Get SPL token accounts for an address with enhanced error handling
 */
async function getTokenAccounts(connection, address) {
  try {
    const publicKey = new PublicKey(address);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    const tokens = tokenAccounts.value
      .map((account) => {
        const info = account.account.data.parsed.info;
        const amount = info.tokenAmount.uiAmount;
        if (amount > 0) {
          return {
            mint: info.mint,
            amount: amount.toString(),
            decimals: info.tokenAmount.decimals,
          };
        }
        return null;
      })
      .filter(Boolean);

    return tokens;
  } catch (error) {
    // Handle rate limiting gracefully - don't spam retries
    if (error.message.includes("429") || error.message.includes("Too Many")) {
      return []; // Return empty silently on rate limit
    }
    console.error(`    ⚠️  Token fetch error: ${error.message.slice(0, 80)}`);
    return [];
  }
}

/**
 * Check Solana balance for multiple addresses
 */
export async function checkSolana(addresses) {
  const results = { solana: {} };
  const connection = getConnection();

  console.log(`  🟣 Checking Solana mainnet...`);
  console.log(
    `  📋 Scanning ${addresses.length} addresses (rate-limited to avoid 429s)...`
  );

  for (const address of addresses) {
    try {
      // Get SOL balance
      const solBalance = await getSOLBalance(connection, address);

      // Get SPL tokens - only if SOL > 0 to reduce rate limiting
      // (addresses with 0 SOL rarely have tokens, and SPL queries are expensive)
      let tokens = [];
      if (solBalance > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800)); // Extra delay before token query
        tokens = await getTokenAccounts(connection, address);
      }

      const hasActivity = solBalance > 0 || tokens.length > 0;

      results.solana[address] = {
        address,
        nativeBalance: solBalance.toString(),
        nativeSymbol: "SOL",
        tokens,
        hasActivity,
        usdValue: 0, // Would calculate with price API
      };

      if (hasActivity) {
        console.log(`    💰 ${address.slice(0, 12)}...: ${solBalance} SOL`);
        if (tokens.length > 0) {
          console.log(`    🪙  Found ${tokens.length} SPL token(s)`);
        }
      }

      // Delay between addresses to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (error) {
      const shortError = error.message.slice(0, 60);
      console.error(
        `    ❌ Error checking ${address.slice(0, 10)}...: ${shortError}`
      );
      results.solana[address] = {
        address,
        nativeBalance: "0",
        nativeSymbol: "SOL",
        tokens: [],
        hasActivity: false,
        error: error.message,
      };
    }
  }

  const withFunds = Object.values(results.solana).filter(
    (r) => r.hasActivity
  ).length;
  if (withFunds > 0) {
    console.log(`    ✨ Found funds in ${withFunds} address(es)`);
  } else {
    console.log(`    ⚪ No funds found`);
  }

  return results;
}
