---
id: overview
title: Chain Events — ETR Webhook Sidecar
sidebar_label: Overview
sidebar_position: 1
---

# Chain Events — ETR Webhook Sidecar

`trustvc-chain-events` is a self-hosted Docker container that watches your Token Registry contracts on-chain and delivers every ETR lifecycle event — mint, transfer, surrender, burn — to your system as a signed HTTP webhook within seconds of chain finality.

## How It Works

![TrustVC Secure Webhook Event Flow](/docs/etr-listener/how-it-works.png)

Each event arrives as a **[CloudEvents 1.0](https://cloudevents.io/)** JSON payload with an `X-TrustVC-Signature` header you can verify independently.

## Why Self-Hosted

| Concern | Sidecar approach |
|---|---|
| Data sovereignty | Events never leave your network |
| Provider flexibility | Use your own Alchemy / QuickNode RPC |
| Compliance | Runs in a private VPC — no outbound except to your RPC and webhook |
| Isolation | Each deployment is fully independent |
| Availability | Decoupled from TrustVC infrastructure |

## Supported Chains

| `chainKey` | Network | Transport |
|---|---|---|
| `ethereum` | Ethereum Mainnet | WebSocket |
| `ethereum-sepolia` | Ethereum Sepolia | WebSocket |
| `polygon` | Polygon Mainnet | WebSocket |
| `polygon-amoy` | Polygon Amoy | WebSocket |
| `xdc` | XDC Network | WebSocket |
| `xdc-apothem` | XDC Apothem | WebSocket |
| `stability` | Stability Mainnet | HTTP polling |
| `stability-testnet` | Stability Testnet | HTTP polling |
| `astron` | Astron Mainnet | HTTP polling |
| `astron-testnet` | Astron Testnet | HTTP polling |

Actual delivery timing depends on your `confirmations` setting in `config.json` — events are held until that many blocks have passed after the transaction. For example, with `"confirmations": 3` on Ethereum, delivery takes roughly 36 seconds (3 × 12 sec).

## Prerequisites

- A container runtime or managed service — Docker, AWS ECS, EC2, or any environment that can run a container image
- Access to an RPC endpoint for each chain you want to watch (WebSocket for EVM chains, HTTP for Stability/Astron)
- A database — PostgreSQL, MySQL, MariaDB, or MSSQL (optional but recommended — enables state persistence and hot restarts)
- An HTTP endpoint on your system that can receive POST requests

:::tip No database?
The container runs without a database using in-memory state. If the container restarts it will replay missed events from the last known block. For production use, connect a database so state survives restarts.
:::

## Next Steps

1. [Quick Start](./quick-start) — get running in under 5 minutes
2. [Configuration Reference](./configuration) — all `config.json` and environment variable options
3. [Webhook Payload & Verification](./webhook-payload) — event schema and signature verification
4. [Registry API](./registry-api) — add and remove registries at runtime
