---
id: configuration
title: Configuration Reference
sidebar_label: Configuration
sidebar_position: 3
---

# Configuration Reference

The container is configured via two sources:

| Source | Purpose |
|---|---|
| `config.json` (volume-mounted) | Chain definitions, webhook URL, server settings |
| Environment variables (`.env` or `-e` flags) | Secrets and deployment-specific overrides |

`${ENV_VAR}` placeholders inside `config.json` values are interpolated from the process environment at startup — use this to keep secrets out of the file.

```json
{
  "chains": [...],
  "webhook": {
    "url": "https://my-system.example.com/events",
    "headers": {
      "Authorization": "Bearer ${WEBHOOK_API_TOKEN}"
    }
  }
}
```

---

## Chain Fields

Each entry in the `chains` array configures one blockchain connection.

| Field | Required | Default | Description |
|---|---|---|---|
| `chainKey` | **Yes** | — | Identifies the chain — see [Supported Chains](/docs/how-tos/chain-events/overview#supported-chains) |
| `rpcUrl` | **Yes** | — | WebSocket (`wss://`, `ws://`) or HTTP (`https://`, `http://`) RPC endpoint |
| `registryAddresses` | No | `[]` | EVM addresses of Token Registries to watch; can be managed at runtime via the [Registry API](./registry-api) |
| `replayFromBlock` | No | `0` | Block number where your registry was deployed — replay starts here on first run |
| `replayBatchSize` | No | `2000` | Max blocks per `eth_getLogs` batch — lower this (e.g. `500`) on free-tier RPCs with rate limits |
| `replayDelayMs` | No | `0` | Delay between replay batches in ms — add `500`–`1000` on free-tier RPCs |
| `confirmations` | No | `1` | Blocks to wait before delivery (max `12`) — increase to reduce reorg risk on faster chains |
| `pollIntervalMs` | No | chain default | Polling interval for HTTP-transport chains (`stability`, `astron`) — omit for WebSocket chains |

:::tip WebSocket vs HTTP RPCs
WebSocket URLs (`wss://`) are used for event subscriptions on Ethereum, Polygon, and XDC — they receive new blocks in real time. Stability and Astron use HTTP polling (`https://`) because they do not support WebSocket subscriptions.
:::

---

## Webhook Fields

| Field | Required | Default | Description |
|---|---|---|---|
| `url` | **Yes** | — | Your downstream HTTP endpoint (must accept POST) |
| `timeoutMs` | No | `10000` | Per-attempt timeout in ms |
| `retryAttempts` | No | `3` | Retries on delivery failure (max `10`) |
| `retryBackoffMs` | No | `1000` | Base backoff in ms — doubles each attempt |
| `headers` | No | none | Extra headers on every delivery (e.g. `Authorization`, `X-Api-Key`) |
| `maxConcurrentDeliveries` | No | `10` | Max in-flight POSTs at the same time |
| `maxQueueSize` | No | `10000` | In-memory event buffer — events beyond this are logged and dropped |

---

## Server Fields

| Field | Required | Default | Description |
|---|---|---|---|
| `port` | No | `8080` | Port for the health check and Registry API |
| `host` | No | `0.0.0.0` | Keep `0.0.0.0` when running inside Docker |
| `workerProcesses` | No | `true` | Spawn each chain in its own OS process for fault isolation — one chain crashing does not affect others |
| `logLevel` | No | `info` | `trace` / `debug` / `info` / `warn` / `error` / `fatal` |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SIGNING_PRIVATE_KEY` | **Yes** | Raw 32-byte Ed25519 seed, base64-encoded — see [Quick Start](./quick-start#step-2--generate-a-signing-key) |
| `CONFIG_PATH` | No | Path to config file inside the container (default: `/app/config.json`) |
| `DB_HOST` | No | Database hostname — enables state persistence and distributed leasing |
| `DB_DIALECT` | No | Database type: `postgres` (default), `mysql`, `mariadb`, or `mssql` |
| `DB_PORT` | No | Database port — defaults to `5432` (postgres), `3306` (mysql/mariadb), `1433` (mssql) |
| `DB_NAME` | No | Database name (default: `trustvc_events`) |
| `DB_USER` | No | Database username (default: `postgres`) |
| `DB_PASSWORD` | No | Database password |
| `DB_POOL_MAX` | No | Connection pool max (default: `5`) |
| `DB_LEASE_TTL_MS` | No | Distributed lease TTL in ms for HA deployments (default: `30000`) |
| `OTEL_ENABLED` | No | Set `true` to enable OpenTelemetry traces and metrics |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OTLP collector endpoint (default: `http://localhost:4318`) |
| `OTEL_SERVICE_NAME` | No | Service name reported in telemetry (default: `trustvc-webhook-events`) |

---

## Full `config.json` Example

```json
{
  "chains": [
    {
      "chainKey": "ethereum-sepolia",
      "rpcUrl": "wss://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}",
      "registryAddresses": [
        "0xe6b5ce7E3691a0927b2806CE6638b35237DFfAc4"
      ],
      "replayFromBlock": 10896377,
      "replayBatchSize": 10000,
      "replayDelayMs": 500,
      "confirmations": 1
    },
    {
      "chainKey": "stability",
      "rpcUrl": "https://rpc.stabilityprotocol.com/zgt/${STABILITY_API_KEY}",
      "registryAddresses": [
        "0xCB524ba5D1C39f86d87af20B180c01aeD4517DcB"
      ],
      "pollIntervalMs": 10000,
      "replayFromBlock": 35000000,
      "replayBatchSize": 5000,
      "replayDelayMs": 5000,
      "confirmations": 1
    },
    {
      "chainKey": "polygon-amoy",
      "rpcUrl": "wss://polygon-amoy-bor-rpc.publicnode.com",
      "registryAddresses": [],
      "replayFromBlock": 39173608,
      "replayBatchSize": 5000
    }
  ],
  "webhook": {
    "url": "https://your-system.example.com/trustvc/events",
    "timeoutMs": 10000,
    "retryAttempts": 3,
    "retryBackoffMs": 1000,
    "headers": {
      "Authorization": "Bearer ${WEBHOOK_SECRET}"
    }
  },
  "server": {
    "port": 8080,
    "host": "0.0.0.0",
    "workerProcesses": true,
    "logLevel": "info"
  }
}
```
