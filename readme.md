# 🔐 Multi-Chain Wallet Auditor

> **Audit wallet balances across 80+ blockchains from a single seed phrase**

A comprehensive Node.js tool that checks your cryptocurrency balances across ALL major blockchains using your 12 or 24-word seed phrase. Completely local and secure - your seed phrase never leaves your computer.

---

## 🌟 Features

- ✅ **80+ Blockchains Supported**
  - 76 EVM chains (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, zkSync, Linea, etc.)
  - Solana + SPL tokens
  - Bitcoin (SegWit + Legacy)
  - Sui + all Sui tokens
  - Aptos + all Aptos tokens
  - Stacks

- ✅ **Complete Token Detection**
  - Native tokens (ETH, BNB, SOL, SUI, APT, etc.)
  - ERC-20 tokens on all EVM chains
  - SPL tokens on Solana
  - All tokens on Sui and Aptos

- ✅ **100% Local & Secure**
  - Seed phrase never sent to any server
  - All derivations happen locally
  - Read-only blockchain queries
  - No telemetry or data collection

- ✅ **Fast & Efficient**
  - Only checks most popular derivation paths
  - Concurrent requests with rate limiting
  - Scans ~88 addresses in under 2 minutes

- ✅ **Comprehensive Reports**
  - JSON report with all balances
  - Human-readable summary
  - USD value estimates
  - Per-chain breakdowns

---

## 🚀 Quick Start

### Prerequisites

- **Node.js v18+** (Download from [nodejs.org](https://nodejs.org/))
- Your **12 or 24-word seed phrase**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Vinay-Madarkhandi/fund-checker-through-12-words-phrase
cd scripts
```

2. **Install dependencies**
```bash
npm install
```

3. **Create your seed configuration**
```bash
# Copy the example file
cp seed.example.json seed.json

# Edit seed.json with your actual seed phrase
notepad seed.json  # Windows
nano seed.json     # Linux/Mac
```

4. **Edit seed.json** - Replace with your actual seed phrase:
```json
{
  "seed": "your twelve or twenty four word seed phrase goes here"
}
```

5. **Run the auditor**
```bash
npm start
```

---

## 📖 Detailed Setup Guide

### Step 1: Prepare Your Seed Phrase

**What is a seed phrase?**
- A seed phrase (also called mnemonic phrase or recovery phrase) is 12 or 24 words
- It's used to recover your cryptocurrency wallets
- Example: `exaple1 monster example exapme1 tongue example1 finish exapmle alley example1 leg example`

**Where to find it:**
- MetaMask: Settings → Security & Privacy → Reveal Secret Recovery Phrase
- Trust Wallet: Settings → Wallets → [Your Wallet] → Show Recovery Phrase
- Phantom: Settings → Export Private Key → Show Seed Phrase
- Hardware wallets: Written on recovery card during setup

⚠️ **SECURITY WARNING:**
- NEVER share your seed phrase with anyone
- The tool only reads it locally - it never sends it anywhere
- Make sure you're running the tool on YOUR computer, not a shared/public device

### Step 2: Configure seed.json

Create a file named `seed.json` in the scripts folder:

```json
{
  "seed": "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
}
```

**For 24-word seed phrases:**
```json
{
  "seed": "word1 word2 word3 ... word24"
}
```

**Validation:**
The tool automatically validates that your seed phrase is:
- ✅ Valid BIP39 format
- ✅ Contains 12 or 24 words
- ✅ Uses correct word list

### Step 3: Run the Auditor

```bash
npm start
```

**What happens:**
1. You'll see a security warning
2. Type exactly: `I OWN THIS SEED PHRASE`
3. The tool derives addresses locally (no network calls)
4. Checks balances across 80+ blockchains
5. Generates reports in the project folder

**Expected output:**
```
🔐 MULTI-CHAIN WALLET AUDITOR

To proceed, type exactly: I OWN THIS SEED PHRASE
> I OWN THIS SEED PHRASE

✅ Loaded 12-word seed phrase
🔑 Deriving 10 addresses for each blockchain...

🔍 Checking balances across all blockchains...
  ✅ EVM Chains: Found funds on 3 chains
  ✅ Solana: No funds found
  ✅ Bitcoin: Found funds on 1 address
  ...

💰 Total estimated value: $1,234.56
📄 Reports saved to: report.json, report-summary.txt
```

---

## 📊 Understanding Your Reports

### report.json (Detailed JSON)
Contains complete data for all chains and addresses:
```json
{
  "checkedAt": "2025-10-04T12:00:00Z",
  "summary": {
    "chainsWithFunds": ["ethereum", "polygon"],
    "totalUsdEstimate": 1234.56
  },
  "results": {
    "ethereum": {
      "0xYourAddress": {
        "nativeBalance": "0.5",
        "tokens": [...],
        "usdValue": 1200.00
      }
    }
  }
}
```

### report-summary.txt (Human-Readable)
Simple text summary:
```
Multi-Chain Wallet Audit Report
Generated: 2025-10-04 12:00:00

Chains with funds: 2
  • ethereum
  • polygon

Total estimated value: $1,234.56

Details:
Ethereum (0xYour...): 0.5 ETH ($1,200.00)
Polygon (0xYour...): 100 MATIC ($34.56)
```

---

## 🎯 Supported Blockchains

### EVM Chains (76 total)

**Layer 1 Blockchains:**
- Ethereum
- BNB Smart Chain
- Polygon PoS
- Avalanche C-Chain
- Fantom
- Cronos
- Gnosis Chain
- Moonbeam
- Moonriver
- Celo
- Aurora
- Kava EVM
- Evmos
- And 30+ more...

**Layer 2 Solutions:**
- Arbitrum One
- Optimism
- Base
- zkSync Era
- Linea
- Scroll
- Polygon zkEVM
- Mantle
- Blast
- Manta Pacific
- Mode Network
- Zora
- opBNB
- Fraxtal
- Taiko
- Kroma
- Boba Network
- Redstone
- And more...

**Gaming & Specialized:**
- Harmony
- Metis Andromeda
- Oasys
- ThunderCore
- WEMIX3.0
- Astar
- Rootstock (RSK)
- Fuse Network
- Telos EVM
- KuCoin Community Chain
- Klaytn

### Non-EVM Chains (6 ecosystems)

- **Solana** - SOL + SPL tokens (USDC, USDT, etc.)
- **Bitcoin** - BTC (SegWit + Legacy addresses)
- **Sui** - SUI + all Sui ecosystem tokens
- **Aptos** - APT + all Aptos tokens
- **Stacks** - STX (Bitcoin layer)

---

## ⚙️ Configuration Options

### Change Number of Addresses

Edit `src/index.js` line 16:
```javascript
const addressCount = 10; // Change to 5, 20, 50, etc.
```

**Recommendations:**
- `5` - Quick scan, standard wallets
- `10` - Default, good balance
- `20` - Thorough scan
- `50+` - Very thorough, slower

### Enable Debug Mode

Set environment variable:
```bash
DEBUG=true npm start
```

Shows detailed derivation info and API calls.

---

## 🔒 Security & Privacy

### What This Tool Does:
- ✅ Reads your seed phrase from local `seed.json` file
- ✅ Derives addresses locally using BIP39/BIP44 standards
- ✅ Queries PUBLIC blockchain APIs for balances (read-only)
- ✅ Never sends seed phrase or private keys anywhere

### What This Tool Does NOT Do:
- ❌ Never uploads your seed phrase to any server
- ❌ Never stores private keys (only addresses)
- ❌ Never signs transactions
- ❌ Never sends any data except balance queries to public RPCs
- ❌ No telemetry or analytics

### Best Practices:
1. **Run locally** - Don't use on shared/public computers
2. **Verify the code** - Check `src/` files before running
3. **Keep seed.json secure** - It's in `.gitignore` by default
4. **Use on trusted networks** - Avoid public WiFi
5. **Backup seed.json** - Store securely offline after testing

### File Security:
The `.gitignore` automatically excludes:
- `seed.json` - Your actual seed phrase
- `report.json` - Generated reports with addresses
- `report-summary.txt` - Summary reports
- `node_modules/` - Dependencies

**Never commit these files to version control!**

---

## 🛠️ Troubleshooting

### "Invalid seed phrase" error
**Problem:** Seed phrase validation failed

**Solutions:**
- Check for typos in `seed.json`
- Ensure 12 or 24 words (not 11, 13, or other numbers)
- Remove extra spaces between words
- Use lowercase words
- Verify words are from BIP39 word list

### "429 Too Many Requests" errors
**Problem:** RPC rate limiting

**Solutions:**
- Wait 1-2 minutes and run again
- Reduce `addressCount` in configuration
- Some chains show this - it's normal, just skips those addresses

### No funds found but you have funds
**Possible causes:**

1. **Different seed phrase:**
   - Check if the seed phrase in `seed.json` matches your wallet
   - Some wallets (like Slush with Google login) don't use seed phrases

2. **Different derivation path:**
   - Increase `addressCount` to 20 or 50
   - Contact maintainer with wallet app name for custom path support

3. **Wrong blockchain:**
   - Verify you're checking the right blockchain
   - Check if the token is on a different network

### Sui wallet not found (Slush Wallet users)
**Problem:** Slush Wallet with Google login uses different keys

**Solution:** Use the direct checker:
```bash
node check-sui-direct.js
```
Edit the file and replace the address with yours.

---

## 📚 Advanced Usage

### Check Specific Address Directly

For Sui (useful for social login wallets):
```bash
node check-sui-direct.js
```

Edit the file to change the address being checked.

### Custom Derivation Paths

Edit `src/derivation.js` to add custom paths:
```javascript
const DERIVATION_PATHS = {
  myCustomPath: "m/44'/60'/5'/0", // Your custom path
};
```

### API Key Configuration (Optional)

Some chains work better with API keys. Edit `config/chains.json`:
```json
{
  "ethereum": {
    "rpc": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
  }
}
```

---

## 🤝 Contributing

Found a bug or want to add a blockchain?

1. Fork the repository
2. Create a feature branch: `git checkout -b add-new-chain`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

**Adding a new EVM chain:**
Edit `src/evm-checker.js` and add to `EVM_CHAINS`:
```javascript
newchain: {
  name: 'New Chain',
  chainId: 12345,
  rpc: 'https://rpc.newchain.io',
  nativeCurrency: 'NEW'
}
```

---

## 📝 License

MIT License - See LICENSE file for details

---

## ⚠️ Disclaimer

This tool is for informational purposes only. 

- **Not financial advice** - Always verify balances on official explorers
- **Use at your own risk** - Test with small amounts first
- **No warranty** - Software provided "as is"
- **Your responsibility** - Keep your seed phrase secure

The maintainers are not responsible for:
- Lost funds due to misuse
- Errors in balance reporting
- Security breaches from improper usage
- Issues with third-party RPC providers

---

## 📞 Support

**Issues:** Open an issue on GitHub
**Questions:** Check existing issues first
**Security concerns:** Contact maintainers privately

---

## 🎉 Acknowledgments

Built with:
- [bip39](https://github.com/bitcoinjs/bip39) - Mnemonic generation
- [ethers.js](https://docs.ethers.org/) - Ethereum interaction
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana interaction
- [@mysten/sui.js](https://sdk.mystenlabs.com/typescript) - Sui interaction
- [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) - Bitcoin utilities

---

## 🚀 Quick Reference

```bash
# Install
npm install

# Setup
cp seed.example.json seed.json
# Edit seed.json with your phrase

# Run
npm start

# Check specific Sui address
node check-sui-direct.js

# Clean reports
rm report*.json report*.txt
```

---

**Happy auditing! 🎯**

If this tool helped you find forgotten funds, consider starring the repo ⭐
