---
id: deployment
title: Deployment
sidebar_label: Deployment
---

## Obligation Registry

The Obligation Registry contract (`TrustVCToken`) is deployed together with its own `ObligationEscrowFactory` — the same two-contract pattern as a standalone Token Registry deployment, but using the obligation contracts instead of the classic ETR ones.

### Installing TrustVC CLI

#### Binary

To install the binary, simply download the binary from the [CLI release page](https://github.com/TrustVC/trustvc-cli/releases) for your OS.

#### NPM

For Linux or MacOS users, if you have npm installed on your machine, you may install the CLI using the following command:

```bash
npm install -g @trustvc/trustvc-cli
```

The above command will install the TrustVC CLI to your machine. You will need to have node.js installed to be able to run the command.

You can also opt to use npx:

```bash
npx @trustvc/trustvc-cli <arguments>
```

### Deploying via CLI

```bash
trustvc obligation-registry deploy
```

The CLI will interactively prompt you for:

1. **Network selection**: Choose from available networks (e.g., sepolia, polygon-amoy)
2. **Registry name and symbol**: e.g. "My Obligation Registry", "MOR"
3. **ObligationEscrowFactory address** (optional): reuse an existing factory, or let the CLI deploy a new one
4. **Wallet selection**: Choose between encrypted wallet, private key file, or environment variable
5. **Dry-run confirmation** before broadcasting

**Save your Obligation Registry address.** You'll need it for `credentialStatus.obligationRegistry` when signing Bill of Exchange documents, and for every `obligation-registry` / `obligation-escrow` command afterwards.

### Deploying via Code

#### Installation

```bash
npm install --save  @trustvc/trustvc
```

---

#### Usage

To use the package, you will need to provide your own Web3 [provider](https://docs.ethers.io/v5/api/providers/api-providers/) or [signer](https://docs.ethers.io/v5/api/signer/#Wallet) (if you are writing to the blockchain).

> Full function reference: [trustvc SDK README — Obligation Registry (BoE)](https://github.com/TrustVC/trustvc/blob/main/README.md#c-obligation-registry-boe).

The quickest way to deploy is the SDK's convenience function, which deploys a new `ObligationEscrowFactory` and `TrustVCToken` for you in a single call:

```ts
import { deployObligationRegistry } from "@trustvc/trustvc";

const { obligationRegistry, obligationEscrowFactoryAddress } = await deployObligationRegistry(
  "My Obligation Registry",
  "MOR",
  signer,
  { chainId },
);
```

If you'd rather deploy — or reuse — the two contracts yourself (for example, to share one `ObligationEscrowFactory` across multiple registries), deploy them directly:

```ts
import { ethers } from "hardhat";

const escrowFactory = await (await ethers.getContractFactory("ObligationEscrowFactory")).deploy();
await escrowFactory.waitForDeployment();

const token = await (
  await ethers.getContractFactory("TrustVCToken")
).deploy("My Obligation Registry", "MOR", await escrowFactory.getAddress());
await token.waitForDeployment();
```

The deployer becomes the default admin — the same role model as `TradeTrustToken`.
