/**
 * Address Derivation Module
 *
 * Derives wallet addresses for all supported blockchains using BIP39/BIP44 standards.
 * All derivations are done locally - private keys never leave this module.
 */

import * as bip39 from "bip39";
import { HDNodeWallet, Wallet } from "ethers";
import { Keypair } from "@solana/web3.js";
import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";
import { derivePath } from "ed25519-hd-key";
import { createHash } from "crypto";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

// Initialize BIP32 with tiny-secp256k1
const bip32 = BIP32Factory(ecc);

/**
 * Derivation paths for each blockchain
 * Using only the MOST POPULAR/STANDARD paths for faster scanning
 */
const DERIVATION_PATHS = {
  evm: [
    (index) => `m/44'/60'/0'/0/${index}`, // Standard Ethereum (MetaMask, Trust Wallet, etc.)
  ],
  solana: [
    (index) => `m/44'/501'/${index}'/0'`, // Standard Solana (Phantom, Solflare)
  ],
  bitcoin: [
    (index) => `m/84'/0'/0'/0/${index}`, // BIP84 Native SegWit (most modern wallets)
    (index) => `m/44'/0'/0'/0/${index}`, // BIP44 Legacy (older wallets)
  ],
  stacks: [
    (index) => `m/44'/5757'/0'/0/${index}`, // Standard Stacks
  ],
  sui: [
    (index) => `m/44'/784'/${index}'/0'/0'`, // Standard Sui Wallet (official)
    (index) => `m/44'/784'/0'/0'/${index}'`, // Sui Wallet alternative
    (index) => `m/44'/784'/0'/0/${index}`, // Suiet, Ethos wallets
  ],
  aptos: [
    (index) => `m/44'/637'/${index}'/0'/0'`, // Standard Petra/Martian wallets
    (index) => `m/44'/637'/0'/0'/${index}'`, // Alternative format
  ],
};

/**
 * Derive EVM addresses (Ethereum, BSC, Polygon, etc.)
 * Tries multiple derivation paths to cover different wallet implementations
 */
function deriveEVMAddresses(seed, count) {
  const addresses = [];
  const hdNode = HDNodeWallet.fromSeed(seed);
  const seen = new Set();

  // Try all derivation paths for each index
  for (let i = 0; i < count; i++) {
    for (const pathFn of DERIVATION_PATHS.evm) {
      const path = pathFn(i);
      const wallet = hdNode.derivePath(path);
      if (!seen.has(wallet.address)) {
        addresses.push(wallet.address);
        seen.add(wallet.address);
      }
    }
  }

  return addresses;
}

/**
 * Derive Solana addresses
 * Tries multiple derivation paths
 */
function deriveSolanaAddresses(seed, count) {
  const addresses = [];
  const seen = new Set();

  for (let i = 0; i < count; i++) {
    for (const pathFn of DERIVATION_PATHS.solana) {
      try {
        const path = pathFn(i);
        const derived = derivePath(path, seed.toString("hex"));
        const keypair = Keypair.fromSeed(derived.key);
        const address = keypair.publicKey.toBase58();
        if (!seen.has(address)) {
          addresses.push(address);
          seen.add(address);
        }
      } catch (error) {
        // Silent fallback for this path
        continue;
      }
    }
  }

  return addresses;
}

/**
 * Derive Bitcoin addresses with multiple standards (BIP44, BIP84, BIP49)
 */
function deriveBitcoinAddresses(seed, count) {
  const addresses = [];
  const root = bip32.fromSeed(seed);
  const seen = new Set();

  for (let i = 0; i < count; i++) {
    for (const pathFn of DERIVATION_PATHS.bitcoin) {
      try {
        const path = pathFn(i);
        const child = root.derivePath(path);

        // Determine address type based on path
        let payment;
        if (path.includes("m/84'")) {
          // Native SegWit (bech32)
          payment = bitcoin.payments.p2wpkh({
            pubkey: child.publicKey,
            network: bitcoin.networks.bitcoin,
          });
        } else if (path.includes("m/49'")) {
          // SegWit (P2SH)
          payment = bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({
              pubkey: child.publicKey,
              network: bitcoin.networks.bitcoin,
            }),
          });
        } else {
          // Legacy (P2PKH)
          payment = bitcoin.payments.p2pkh({
            pubkey: child.publicKey,
            network: bitcoin.networks.bitcoin,
          });
        }

        if (payment.address && !seen.has(payment.address)) {
          addresses.push(payment.address);
          seen.add(payment.address);
        }
      } catch (error) {
        continue;
      }
    }
  }

  return addresses;
}

/**
 * Derive Stacks addresses
 */
function deriveStacksAddresses(seed, count) {
  const addresses = [];
  const hdNode = HDNodeWallet.fromSeed(seed);

  for (let i = 0; i < count; i++) {
    for (const pathFn of DERIVATION_PATHS.stacks) {
      const path = pathFn(i);
      const wallet = hdNode.derivePath(path);

      // Stacks addresses start with 'SP' for mainnet
      // This is simplified - actual conversion needed
      addresses.push(`SP${wallet.address.slice(2, 42)}`);
    }
  }

  console.log("  ⚠️  Stacks derivation: Using simplified implementation");
  return addresses;
}

/**
 * Derive Sui addresses using official Sui SDK
 * Tries multiple derivation paths to cover different wallet implementations
 */
function deriveSuiAddresses(seed, count) {
  const addresses = [];
  const seen = new Set();

  for (let i = 0; i < count; i++) {
    for (const pathFn of DERIVATION_PATHS.sui) {
      try {
        const path = pathFn(i);
        const derived = derivePath(path, seed.toString("hex"));
        const keypair = Ed25519Keypair.fromSecretKey(derived.key);
        const address = keypair.getPublicKey().toSuiAddress();

        if (!seen.has(address)) {
          addresses.push(address);
          seen.add(address);
        }
      } catch (error) {
        // Silent fallback for this path
        continue;
      }
    }
  }

  return addresses;
}

/**
 * Derive Aptos addresses using official Aptos SDK
 * Tries multiple derivation paths to cover different wallet implementations
 */
function deriveAptosAddresses(seed, count) {
  const addresses = [];
  const seen = new Set();

  for (let i = 0; i < count; i++) {
    for (const pathFn of DERIVATION_PATHS.aptos) {
      try {
        const path = pathFn(i);
        const derived = derivePath(path, seed.toString("hex"));
        const privateKey = new Ed25519PrivateKey(derived.key);
        const address = privateKey.publicKey().authKey().toString();

        if (!seen.has(address)) {
          addresses.push(address);
          seen.add(address);
        }
      } catch (error) {
        // Silent fallback for this path
        continue;
      }
    }
  }

  return addresses;
}

/**
 * Main function to derive all addresses from seed phrase
 *
 * @param {string} seedPhrase - 12 or 24 word BIP39 seed phrase
 * @param {number} count - Number of addresses to derive per chain
 * @returns {Object} Object containing arrays of addresses for each blockchain
 */
export function deriveAddresses(seedPhrase, count = 5) {
  // Validate seed phrase
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error("Invalid BIP39 seed phrase");
  }

  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(seedPhrase);

  console.log("🔐 Deriving addresses (all derivations are LOCAL)...\n");

  // Derive addresses for all supported chains
  const addresses = {
    evm: deriveEVMAddresses(seed, count),
    solana: deriveSolanaAddresses(seed, count),
    bitcoin: deriveBitcoinAddresses(seed, count),
    stacks: deriveStacksAddresses(seed, count),
    sui: deriveSuiAddresses(seed, count),
    aptos: deriveAptosAddresses(seed, count),
  };

  return addresses;
}

/**
 * Get a specific private key for a chain (used internally by checkers only)
 * WARNING: Never expose this function's output to logs or external APIs
 */
export function derivePrivateKey(seedPhrase, chain, index = 0) {
  const seed = bip39.mnemonicToSeedSync(seedPhrase);

  if (chain === "evm" || chain === "stacks") {
    const hdNode = HDNodeWallet.fromSeed(seed);
    const path = DERIVATION_PATHS[chain](index);
    return hdNode.derivePath(path).privateKey;
  }

  if (chain === "solana" || chain === "sui" || chain === "aptos") {
    const path = DERIVATION_PATHS[chain](index);
    const derived = derivePath(path, seed.toString("hex"));
    return Buffer.from(derived.key).toString("hex");
  }

  throw new Error(`Private key derivation not implemented for ${chain}`);
}
