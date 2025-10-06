#!/usr/bin/env node

/**
 * Setup Script for Multi-Chain Wallet Auditor
 *
 * This script helps users set up the tool for first use
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║      🔧 Multi-Chain Wallet Auditor - Setup Wizard 🔧         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Welcome! This wizard will help you set up the wallet auditor.

`);

  // Check if seed.json already exists
  if (existsSync("seed.json")) {
    console.log("⚠️  seed.json already exists.");
    const overwrite = await question("Do you want to overwrite it? (yes/no): ");

    if (overwrite.toLowerCase() !== "yes") {
      console.log(
        "\n✅ Setup cancelled. Your existing seed.json is unchanged.\n"
      );
      rl.close();
      return;
    }
  }

  console.log("📝 Seed Phrase Setup\n");
  console.log("You have two options:\n");
  console.log("  1. Enter your seed phrase now (interactive)");
  console.log("  2. Create template file to edit manually later\n");

  const choice = await question("Choose option (1 or 2): ");

  if (choice === "1") {
    console.log(
      "\n⚠️  SECURITY REMINDER: Your seed phrase will be saved to seed.json"
    );
    console.log("Make sure you are on a secure, private computer.\n");

    const proceed = await question("Continue? (yes/no): ");

    if (proceed.toLowerCase() !== "yes") {
      console.log("\n✅ Setup cancelled.\n");
      rl.close();
      return;
    }

    console.log("\n📝 Enter your seed phrase (12 or 24 words):");
    const seedPhrase = await question("> ");

    // Basic validation
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      console.log(
        `\n❌ Invalid seed phrase. Must be 12 or 24 words (you entered ${words.length}).\n`
      );
      rl.close();
      return;
    }

    // Create seed.json
    const seedData = {
      seed: seedPhrase.trim(),
    };

    writeFileSync("seed.json", JSON.stringify(seedData, null, 2));
    console.log("\n✅ seed.json created successfully!");
  } else if (choice === "2") {
    // Copy example file
    const template = {
      seed: "YOUR 12 OR 24 WORD SEED PHRASE GOES HERE",
      _instructions: {
        description:
          "Replace the seed value above with your actual mnemonic phrase",
        security: "NEVER share this file or commit it to version control",
      },
    };

    writeFileSync("seed.json", JSON.stringify(template, null, 2));
    console.log("\n✅ seed.json template created!");
    console.log("\n📝 Next steps:");
    console.log("   1. Open seed.json in a text editor");
    console.log("   2. Replace the placeholder with your actual seed phrase");
    console.log("   3. Save the file\n");
  } else {
    console.log("\n❌ Invalid choice.\n");
    rl.close();
    return;
  }

  // Check .gitignore
  if (!existsSync(".gitignore")) {
    console.log("\n⚠️  No .gitignore found. Creating one...");
    const gitignore = `# Sensitive files
seed.json
*.key
.env

# Dependencies
node_modules/

# Output
report.json
report-summary.txt
`;
    writeFileSync(".gitignore", gitignore);
    console.log("✅ .gitignore created");
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════"
  );
  console.log("                    🎉 Setup Complete! 🎉");
  console.log(
    "═══════════════════════════════════════════════════════════════\n"
  );

  console.log("Next steps:\n");
  console.log("  1. Verify your seed.json file is correct");
  console.log("  2. Run: npm start");
  console.log("  3. Type: I OWN THIS SEED PHRASE (when prompted)");
  console.log("  4. Review the generated reports\n");

  console.log("📚 Documentation:");
  console.log("   - README.md - Full documentation");
  console.log("   - QUICKSTART.md - Quick start guide");
  console.log("   - PROJECT_SUMMARY.md - Technical overview\n");

  console.log("🔒 Security Reminders:");
  console.log("   - Never share seed.json");
  console.log("   - Test with non-funded seed first");
  console.log("   - Verify results on blockchain explorers\n");

  rl.close();
}

setup().catch((error) => {
  console.error("\n❌ Setup failed:", error.message);
  rl.close();
  process.exit(1);
});
