---
id: cli-comparison
title: "Why Move to TrustVC CLI"
sidebar_label: Why Move to TrustVC CLI
---

# Why Move to TrustVC CLI

If you are still using the [**@tradetrust-tt/tradetrust-cli**](https://github.com/TradeTrust/tradetrust-cli) or the [**@trustvc/w3c-cli**](https://github.com/TrustVC/w3c/tree/main/apps/w3c-cli), now is the time to move to the [**TrustVC CLI (@trustvc/trustvc-cli)**](https://github.com/TrustVC/trustvc-cli). Both **@tradetrust-tt/tradetrust-cli** and **@trustvc/w3c-cli** are **deprecated and no longer maintained** — **@tradetrust-tt/tradetrust-cli** has been retired in favor of TrustVC CLI, and **@trustvc/w3c-cli** is a legacy demonstration tool tied to older BBS+ cryptosuites. TrustVC CLI is the single, actively maintained successor to both: it brings together OpenAttestation document handling, W3C Verifiable Credentials, DID management, and blockchain-based transferable records in **one unified tool**, with support for modern cryptosuites (ECDSA-SD-2023, BBS-2023), the latest **Token Registry v5** features (encrypted remarks, rejection commands), and an interactive prompt system that removes the need to remember long flag combinations.

In short, moving to TrustVC CLI consolidates three previously separate workflows into one supported toolchain, unlocks access to the **W3C VC Data Model v2.0** and Token Registry v5, and protects your team from depending on deprecated software.

> **⚠️ DISCLAIMER**
>
> All three CLIs are intended for development, prototyping, and testing of document issuance and verification. They should not be used for production issuance or live document management, as they lack the security, scalability, and operational controls required for real-world environments. For production, integrate the [TrustVC SDK](/docs/migration-guide/trustvc) directly into your systems.

## Feature Comparison

| Capability                                    | @trustvc/trustvc-cli (recommended)                     | @tradetrust-tt/tradetrust-cli         | @trustvc/w3c-cli                     |
| --------------------------------------------- | -------------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| **Status**                                    | Actively maintained, recommended                          | Deprecated, no longer maintained        | Deprecated, no longer maintained       |
| **Repository**                                | [TrustVC/trustvc-cli](https://github.com/TrustVC/trustvc-cli) | [TradeTrust/tradetrust-cli](https://github.com/TradeTrust/tradetrust-cli) | [TrustVC/w3c-cli](https://github.com/TrustVC/w3c/tree/main/apps/w3c-cli) |
| **Primary scope**                             | OpenAttestation + W3C VCs + DIDs + token registry        | OpenAttestation documents & token registry | W3C VCs and DIDs only                  |
| **OpenAttestation v2 / v3 support**           | ✅                                                        | ✅                                       | ❌                                      |
| **W3C VC Data Model v2.0**                    | ✅ ECDSA-SD-2023 & BBS-2023                              | ❌                                       | ⚠️ Legacy BBS+ only                    |
| **DID management (did:web)**                | ✅                                                        | ❌                                       | ✅                                      |
| **Cryptographic key-pair generation**         | ✅                                                        | ❌                                       | ✅                                      |
| **Sign & verify W3C credentials**             | ✅                                                        | ❌                                       | ✅                                      |
| **Credential status (Bitstring StatusList)**  | ✅ (modern Bitstring StatusList)                          | ❌                                       | ✅ (StatusList v2021)                  |
| **Wrap / unwrap OA documents**                | ✅                                                        | ✅                                       | ❌                                      |
| **Encrypt / decrypt documents**               | ✅                                                        | ✅                                       | ❌                                      |
| **Deploy document store**                     | ✅                                                        | ✅                                       | ❌                                      |
| **Deploy token registry**                     | ✅ (v4 and v5)                                            | ✅ (v4 and v5)                           | ❌                                      |
| **Title escrow / transferable records**       | ✅                                                        | ✅                                       | ❌                                      |
| **Token Registry v5 features** (encrypted remarks, rejection commands) | ✅                               | ✅                                       | ❌                                      |
| **Wallet management**                         | ✅                                                        | ✅                                       | ❌                                      |
| **DNS TXT record helpers**                    | ✅                                                        | ✅                                       | ❌                                      |
| **Cancel pending tx (replace-by-fee)**        | ✅                                                        | ❌                                       | ❌                                      |
| **Multi-network support** (Ethereum, Polygon, XDC, Stability, Astron) | ✅                              | ✅                                       | ❌                                      |
| **Interactive prompt system**                 | ✅ Guided prompts for every command                       | ❌ (flag-based)                          | Limited                                |

## What each CLI was for

### @tradetrust-tt/tradetrust-cli (deprecated)

The [**@tradetrust-tt/tradetrust-cli**](https://github.com/TradeTrust/tradetrust-cli) was the original command-line tool for the OpenAttestation ecosystem. It handled document wrapping, signing, encryption, document-store and token-registry deployment, and title-escrow operations through a flag-driven interface. It is **deprecated and no longer maintained** — we recommend migrating to **@trustvc/trustvc-cli**, which offers the same functionality with continued support and updates.

### @trustvc/w3c-cli (deprecated)

The [**@trustvc/w3c-cli**](https://github.com/TrustVC/w3c/tree/main/apps/w3c-cli), which lives inside the **TrustVC/w3c** monorepo, is a narrow demonstration tool focused only on W3C Verifiable Credentials and DIDs. Its six commands cover key-pair generation, **did:web** creation, signing, verification, and Bitstring credential status create/update. It is also **deprecated**: it was built around legacy BBS+ cryptosuites and has been superseded by the modern W3C Data Integrity cryptosuites (ECDSA-SD-2023, BBS-2023) implemented in the TrustVC CLI.

### @trustvc/trustvc-cli (recommended)

The [**TrustVC CLI (@trustvc/trustvc-cli)**](https://github.com/TrustVC/trustvc-cli) is the consolidated successor to both tools above. It is the only CLI that brings the full TrustVC stack under one binary:

- **W3C Verifiable Credentials** — generate key pairs, create **did:web** identifiers, sign and verify credentials using modern cryptosuites, and manage revocation via Bitstring status lists.
- **OpenAttestation documents** — wrap/unwrap, sign/verify, and encrypt/decrypt OA v2 and v3 documents with full backward compatibility.
- **Transferable records & token registry** — deploy and manage document store and token registry contracts (v4 and v5), execute title-escrow flows including **encrypted remarks** and the new **rejection commands** introduced in v5.
- **Operations** — encrypted wallet creation, role-based access control, DNS record helpers, and replace-by-fee cancellation of pending transactions.
- **Networks** — Ethereum, Polygon, XDC, Stability, and Astron (mainnet and testnet).
- **Interactive prompts** — every command guides you through the required inputs step-by-step, instead of requiring long flag strings.

## Migrating from @tradetrust-tt/tradetrust-cli or @trustvc/w3c-cli

Install the TrustVC CLI:

```bash
npm install -g @trustvc/trustvc-cli
```

Or run without installing:

```bash
npx @trustvc/trustvc-cli <command>
```

Verify the installation:

```bash
trustvc --version
```

From there, the previous **tradetrust ...** commands map onto **trustvc ...** equivalents, but instead of passing every parameter as a flag you will be prompted for the required inputs interactively. For example:

```bash
# Before (@tradetrust-tt/tradetrust-cli)
tradetrust deploy token-registry "My Registry" MYR --network sepolia -f key.txt

# After (@trustvc/trustvc-cli)
trustvc deploy token-registry
```

For the full title-escrow flow under Token Registry v5, including encrypted remarks and rejection commands, see the [Migration to TrustVC CLI](/docs/migration-guide/migration-tt-cli-v5) guide.
