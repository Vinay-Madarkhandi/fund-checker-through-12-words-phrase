/**
 * EVM Chains Balance Checker
 *
 * Checks balances across all major EVM-compatible chains:
 * Ethereum, BSC, Polygon, Avalanche, Arbitrum, Optimism, Base, etc.
 */

import { ethers } from "ethers";
import axios from "axios";
import pLimit from "p-limit";

// Rate limiting: max 3 concurrent requests per provider
const limit = pLimit(3);

/**
 * EVM Chain configurations - 90+ chains
 */
const EVM_CHAINS = {
  // === LAYER 1 BLOCKCHAINS ===
  ethereum: {
    name: "Ethereum",
    rpc: "https://eth.llamarpc.com",
    chainId: 1,
    nativeSymbol: "ETH",
  },
  bsc: {
    name: "BNB Smart Chain",
    rpc: "https://bsc-dataseed1.binance.org",
    chainId: 56,
    nativeSymbol: "BNB",
  },
  polygon: {
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
    chainId: 137,
    nativeSymbol: "MATIC",
  },
  avalanche: {
    name: "Avalanche C-Chain",
    rpc: "https://api.avax.network/ext/bc/C/rpc",
    chainId: 43114,
    nativeSymbol: "AVAX",
  },
  fantom: {
    name: "Fantom",
    rpc: "https://rpc.ftm.tools",
    chainId: 250,
    nativeSymbol: "FTM",
  },
  cronos: {
    name: "Cronos",
    rpc: "https://evm.cronos.org",
    chainId: 25,
    nativeSymbol: "CRO",
  },
  gnosis: {
    name: "Gnosis Chain",
    rpc: "https://rpc.gnosischain.com",
    chainId: 100,
    nativeSymbol: "xDAI",
  },
  moonbeam: {
    name: "Moonbeam",
    rpc: "https://rpc.api.moonbeam.network",
    chainId: 1284,
    nativeSymbol: "GLMR",
  },
  moonriver: {
    name: "Moonriver",
    rpc: "https://rpc.api.moonriver.moonbeam.network",
    chainId: 1285,
    nativeSymbol: "MOVR",
  },
  celo: {
    name: "Celo",
    rpc: "https://forno.celo.org",
    chainId: 42220,
    nativeSymbol: "CELO",
  },
  harmony: {
    name: "Harmony",
    rpc: "https://api.harmony.one",
    chainId: 1666600000,
    nativeSymbol: "ONE",
  },
  aurora: {
    name: "Aurora",
    rpc: "https://mainnet.aurora.dev",
    chainId: 1313161554,
    nativeSymbol: "ETH",
  },
  metis: {
    name: "Metis Andromeda",
    rpc: "https://andromeda.metis.io/?owner=1088",
    chainId: 1088,
    nativeSymbol: "METIS",
  },
  kava: {
    name: "Kava EVM",
    rpc: "https://evm.kava.io",
    chainId: 2222,
    nativeSymbol: "KAVA",
  },
  evmos: {
    name: "Evmos",
    rpc: "https://evmos-evm.publicnode.com",
    chainId: 9001,
    nativeSymbol: "EVMOS",
  },
  klaytn: {
    name: "Klaytn",
    rpc: "https://public-node-api.klaytnapi.com/v1/cypress",
    chainId: 8217,
    nativeSymbol: "KLAY",
  },

  // === LAYER 2 - ETHEREUM ROLLUPS ===
  arbitrum: {
    name: "Arbitrum One",
    rpc: "https://arb1.arbitrum.io/rpc",
    chainId: 42161,
    nativeSymbol: "ETH",
  },
  optimism: {
    name: "Optimism",
    rpc: "https://mainnet.optimism.io",
    chainId: 10,
    nativeSymbol: "ETH",
  },
  base: {
    name: "Base",
    rpc: "https://mainnet.base.org",
    chainId: 8453,
    nativeSymbol: "ETH",
  },
  zksync: {
    name: "zkSync Era",
    rpc: "https://mainnet.era.zksync.io",
    chainId: 324,
    nativeSymbol: "ETH",
  },
  linea: {
    name: "Linea",
    rpc: "https://rpc.linea.build",
    chainId: 59144,
    nativeSymbol: "ETH",
  },
  scroll: {
    name: "Scroll",
    rpc: "https://rpc.scroll.io",
    chainId: 534352,
    nativeSymbol: "ETH",
  },
  mantle: {
    name: "Mantle",
    rpc: "https://rpc.mantle.xyz",
    chainId: 5000,
    nativeSymbol: "MNT",
  },
  polygonzkevm: {
    name: "Polygon zkEVM",
    rpc: "https://zkevm-rpc.com",
    chainId: 1101,
    nativeSymbol: "ETH",
  },
  blast: {
    name: "Blast",
    rpc: "https://rpc.blast.io",
    chainId: 81457,
    nativeSymbol: "ETH",
  },
  manta: {
    name: "Manta Pacific",
    rpc: "https://pacific-rpc.manta.network/http",
    chainId: 169,
    nativeSymbol: "ETH",
  },
  mode: {
    name: "Mode Network",
    rpc: "https://mainnet.mode.network",
    chainId: 34443,
    nativeSymbol: "ETH",
  },
  zora: {
    name: "Zora",
    rpc: "https://rpc.zora.energy",
    chainId: 7777777,
    nativeSymbol: "ETH",
  },
  opbnb: {
    name: "opBNB",
    rpc: "https://opbnb-mainnet-rpc.bnbchain.org",
    chainId: 204,
    nativeSymbol: "BNB",
  },
  fraxtal: {
    name: "Fraxtal",
    rpc: "https://rpc.frax.com",
    chainId: 252,
    nativeSymbol: "frxETH",
  },
  taiko: {
    name: "Taiko",
    rpc: "https://rpc.mainnet.taiko.xyz",
    chainId: 167000,
    nativeSymbol: "ETH",
  },
  kroma: {
    name: "Kroma",
    rpc: "https://api.kroma.network/rpc",
    chainId: 255,
    nativeSymbol: "ETH",
  },
  boba: {
    name: "Boba Network",
    rpc: "https://mainnet.boba.network",
    chainId: 288,
    nativeSymbol: "ETH",
  },
  redstone: {
    name: "Redstone",
    rpc: "https://rpc.redstonechain.com",
    chainId: 690,
    nativeSymbol: "ETH",
  },

  // === ADDITIONAL L1 CHAINS ===
  rootstock: {
    name: "Rootstock (RSK)",
    rpc: "https://public-node.rsk.co",
    chainId: 30,
    nativeSymbol: "RBTC",
  },
  kcc: {
    name: "KuCoin Community Chain",
    rpc: "https://rpc-mainnet.kcc.network",
    chainId: 321,
    nativeSymbol: "KCS",
  },
  fuse: {
    name: "Fuse Network",
    rpc: "https://rpc.fuse.io",
    chainId: 122,
    nativeSymbol: "FUSE",
  },
  telos: {
    name: "Telos EVM",
    rpc: "https://mainnet.telos.net/evm",
    chainId: 40,
    nativeSymbol: "TLOS",
  },
  oasys: {
    name: "Oasys",
    rpc: "https://rpc.mainnet.oasys.games",
    chainId: 248,
    nativeSymbol: "OAS",
  },
  thundercore: {
    name: "ThunderCore",
    rpc: "https://mainnet-rpc.thundercore.com",
    chainId: 108,
    nativeSymbol: "TT",
  },
  wemix: {
    name: "WEMIX3.0",
    rpc: "https://api.wemix.com",
    chainId: 1111,
    nativeSymbol: "WEMIX",
  },
  astar: {
    name: "Astar",
    rpc: "https://evm.astar.network",
    chainId: 592,
    nativeSymbol: "ASTR",
  },

  // === NEW ADDITIONS - MORE L2s & ALT L1s ===
  arbitrumnova: {
    name: "Arbitrum Nova",
    rpc: "https://nova.arbitrum.io/rpc",
    chainId: 42170,
    nativeSymbol: "ETH",
  },
  flare: {
    name: "Flare",
    rpc: "https://flare-api.flare.network/ext/C/rpc",
    chainId: 14,
    nativeSymbol: "FLR",
  },
  songbird: {
    name: "Songbird",
    rpc: "https://songbird-api.flare.network/ext/C/rpc",
    chainId: 19,
    nativeSymbol: "SGB",
  },
  syscoin: {
    name: "Syscoin",
    rpc: "https://rpc.syscoin.org",
    chainId: 57,
    nativeSymbol: "SYS",
  },
  velas: {
    name: "Velas",
    rpc: "https://evmexplorer.velas.com/rpc",
    chainId: 106,
    nativeSymbol: "VLX",
  },
  energi: {
    name: "Energi",
    rpc: "https://nodeapi.energi.network",
    chainId: 39797,
    nativeSymbol: "NRG",
  },
  milkomeda: {
    name: "Milkomeda C1",
    rpc: "https://rpc-mainnet-cardano-evm.c1.milkomeda.com",
    chainId: 2001,
    nativeSymbol: "milkADA",
  },
  hoo: {
    name: "Hoo Smart Chain",
    rpc: "https://http-mainnet.hoosmartchain.com",
    chainId: 70,
    nativeSymbol: "HOO",
  },
  iotex: {
    name: "IoTeX",
    rpc: "https://babel-api.mainnet.iotex.io",
    chainId: 4689,
    nativeSymbol: "IOTX",
  },
  tombchain: {
    name: "Tomb Chain",
    rpc: "https://rpc.tombchain.com",
    chainId: 6969,
    nativeSymbol: "TOMB",
  },
  smartbch: {
    name: "SmartBCH",
    rpc: "https://smartbch.greyh.at",
    chainId: 10000,
    nativeSymbol: "BCH",
  },
  ethereumpow: {
    name: "EthereumPoW",
    rpc: "https://mainnet.ethereumpow.org",
    chainId: 10001,
    nativeSymbol: "ETHW",
  },
  ethereumfair: {
    name: "EthereumFair",
    rpc: "https://rpc.etherfair.org",
    chainId: 513100,
    nativeSymbol: "ETHF",
  },
  pulsechain: {
    name: "PulseChain",
    rpc: "https://rpc.pulsechain.com",
    chainId: 369,
    nativeSymbol: "PLS",
  },
  core: {
    name: "Core Blockchain",
    rpc: "https://rpc.coredao.org",
    chainId: 1116,
    nativeSymbol: "CORE",
  },
  conflux: {
    name: "Conflux eSpace",
    rpc: "https://evm.confluxrpc.com",
    chainId: 1030,
    nativeSymbol: "CFX",
  },
  okxchain: {
    name: "OKX Chain",
    rpc: "https://exchainrpc.okex.org",
    chainId: 66,
    nativeSymbol: "OKT",
  },
  heco: {
    name: "Huobi ECO Chain",
    rpc: "https://http-mainnet.hecochain.com",
    chainId: 128,
    nativeSymbol: "HT",
  },
  bittorrent: {
    name: "BitTorrent Chain",
    rpc: "https://rpc.bittorrentchain.io",
    chainId: 199,
    nativeSymbol: "BTT",
  },
  dogechain: {
    name: "Dogechain",
    rpc: "https://rpc.dogechain.dog",
    chainId: 2000,
    nativeSymbol: "DOGE",
  },

  // === GAMING & NFT FOCUSED ===
  immutablex: {
    name: "Immutable zkEVM",
    rpc: "https://rpc.immutable.com",
    chainId: 13371,
    nativeSymbol: "IMX",
  },
  ronin: {
    name: "Ronin",
    rpc: "https://api.roninchain.com/rpc",
    chainId: 2020,
    nativeSymbol: "RON",
  },
  xai: {
    name: "Xai",
    rpc: "https://xai-chain.net/rpc",
    chainId: 660279,
    nativeSymbol: "XAI",
  },

  // === NEWER LAYER 2s ===
  zkfair: {
    name: "ZKFair",
    rpc: "https://rpc.zkfair.io",
    chainId: 42766,
    nativeSymbol: "USDC",
  },
  merlin: {
    name: "Merlin Chain",
    rpc: "https://rpc.merlinchain.io",
    chainId: 4200,
    nativeSymbol: "BTC",
  },
  bevm: {
    name: "BEVM",
    rpc: "https://rpc-mainnet-1.bevm.io",
    chainId: 11501,
    nativeSymbol: "BTC",
  },
  zeta: {
    name: "Zetachain",
    rpc: "https://zetachain-evm.blockpi.network/v1/rpc/public",
    chainId: 7000,
    nativeSymbol: "ZETA",
  },
  polygon_miden: {
    name: "Polygon Miden",
    rpc: "https://rpc.miden.polygon.technology",
    chainId: 1088888,
    nativeSymbol: "ETH",
  },

  // === PRIVACY & SPECIAL PURPOSE ===
  oasis_emerald: {
    name: "Oasis Emerald",
    rpc: "https://emerald.oasis.dev",
    chainId: 42262,
    nativeSymbol: "ROSE",
  },
  oasis_sapphire: {
    name: "Oasis Sapphire",
    rpc: "https://sapphire.oasis.io",
    chainId: 23294,
    nativeSymbol: "ROSE",
  },

  // === ADDITIONAL NETWORKS ===
  canto: {
    name: "Canto",
    rpc: "https://canto.slingshot.finance",
    chainId: 7700,
    nativeSymbol: "CANTO",
  },
  kinto: {
    name: "Kinto",
    rpc: "https://rpc.kinto.xyz/http",
    chainId: 7887,
    nativeSymbol: "ETH",
  },
  meld: {
    name: "MELD",
    rpc: "https://rpc-1.meld.com",
    chainId: 333000333,
    nativeSymbol: "gMELD",
  },
  shibarium: {
    name: "Shibarium",
    rpc: "https://www.shibrpc.com",
    chainId: 109,
    nativeSymbol: "BONE",
  },
  lukso: {
    name: "LUKSO",
    rpc: "https://rpc.mainnet.lukso.network",
    chainId: 42,
    nativeSymbol: "LYX",
  },
  neon: {
    name: "Neon EVM",
    rpc: "https://neon-proxy-mainnet.solana.p2p.org",
    chainId: 245022934,
    nativeSymbol: "NEON",
  },
};

/**
 * Retry wrapper for network requests with STRICT limits
 */
async function retryRequest(fn, maxRetries = 2, delay = 800) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      // Only retry on specific network errors, not auth errors
      if (
        error.message?.includes("Unauthorized") ||
        error.message?.includes("API key") ||
        error.code === "BAD_DATA"
      ) {
        throw error; // Don't retry auth errors
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create provider with strict timeout and no auto-detection
 */
function createProvider(rpc, chainId) {
  const fetchRequest = new ethers.FetchRequest(rpc);
  fetchRequest.timeout = 10000; // 10 second timeout
  fetchRequest.retryLimit = 1; // Max 1 retry

  const provider = new ethers.JsonRpcProvider(
    fetchRequest,
    chainId,
    { staticNetwork: true } // Disable network auto-detection
  );

  return provider;
}

/**
 * Get native balance for an address on a specific chain
 */
async function getNativeBalance(provider, address, chainName) {
  try {
    const balance = await Promise.race([
      retryRequest(() => provider.getBalance(address)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout after 15s")), 15000)
      ),
    ]);
    const balanceInEther = ethers.formatEther(balance);
    return {
      balance: balanceInEther,
      symbol: EVM_CHAINS[chainName].nativeSymbol,
    };
  } catch (error) {
    // Only log meaningful errors, skip common expected errors
    if (
      !error.message?.includes("Unauthorized") &&
      !error.message?.includes("API key") &&
      !error.message?.includes("ENOTFOUND") &&
      !error.message?.includes("Timeout")
    ) {
      console.error(`    ❌ ${chainName}: ${error.message.slice(0, 80)}`);
    }
    return {
      balance: "0",
      symbol: EVM_CHAINS[chainName].nativeSymbol,
      error: error.message,
    };
  }
}

/**
 * Get ERC-20 token balances (simplified - checks common tokens)
 * In production, use APIs like Moralis, Alchemy, or chain-specific explorers
 */
async function getTokenBalances(provider, address, chainName) {
  // This is a placeholder - full implementation would query token APIs
  // For now, we'll just return empty array
  return [];
}

/**
 * Check balance for a single address on a single chain
 */
async function checkAddressOnChain(address, chainKey, chainConfig) {
  try {
    const provider = createProvider(chainConfig.rpc, chainConfig.chainId);

    // Get native balance with timeout
    const nativeBalance = await getNativeBalance(provider, address, chainKey);

    // Get token balances (placeholder)
    const tokens = await getTokenBalances(provider, address, chainKey);

    const hasActivity =
      parseFloat(nativeBalance.balance) > 0 || tokens.length > 0;

    if (hasActivity) {
      console.log(
        `    💰 ${chainConfig.name}: ${nativeBalance.balance} ${nativeBalance.symbol}`
      );
    }

    return {
      address,
      nativeBalance: nativeBalance.balance,
      nativeSymbol: nativeBalance.symbol,
      tokens,
      hasActivity,
      usdValue: 0, // Would be calculated with price API
    };
  } catch (error) {
    console.error(
      `    ❌ ${chainConfig.name} error for ${address}: ${error.message}`
    );
    return {
      address,
      nativeBalance: "0",
      nativeSymbol: chainConfig.nativeSymbol,
      tokens: [],
      hasActivity: false,
      error: error.message,
    };
  }
}

/**
 * Check all EVM chains for all provided addresses
 */
export async function checkEVMChains(addresses) {
  const results = {};

  // Check each chain
  for (const [chainKey, chainConfig] of Object.entries(EVM_CHAINS)) {
    console.log(`  🔗 Checking ${chainConfig.name}...`);
    results[chainKey] = {};

    // Check all addresses on this chain with rate limiting
    const promises = addresses.map((address) =>
      limit(() => checkAddressOnChain(address, chainKey, chainConfig))
    );

    const chainResults = await Promise.allSettled(promises);

    chainResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results[chainKey][addresses[index]] = result.value;
      } else {
        results[chainKey][addresses[index]] = {
          address: addresses[index],
          nativeBalance: "0",
          error: result.reason.message,
          hasActivity: false,
        };
      }
    });

    // Count addresses with funds
    const withFunds = Object.values(results[chainKey]).filter(
      (r) => r.hasActivity
    ).length;
    if (withFunds > 0) {
      console.log(`    ✨ Found funds in ${withFunds} address(es)`);
    } else {
      console.log(`    ⚪ No funds found`);
    }
  }

  return results;
}
