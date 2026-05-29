---
id: rate-limits
title: Avoiding RPC Rate Limits
sidebar_label: Rate Limits
sidebar_position: 6
---

# Avoiding RPC Rate Limits

When the container first starts it replays historical events by scanning blocks in batches using `eth_getLogs`. Free-tier and public RPC endpoints enforce strict rate limits — too many requests too fast will result in `429 Too Many Requests` errors and missed events.

The following config fields let you tune replay speed to stay within your RPC's limits.

---

## Key Fields

| Field | Default | What it controls |
|---|---|---|
| `replayBatchSize` | `2000` | Max number of blocks scanned per `eth_getLogs` call |
| `replayDelayMs` | `0` | Pause between each batch in milliseconds |
| `confirmations` | `1` | Blocks to wait after a transaction before delivering the event |
| `pollIntervalMs` | chain default | How often HTTP-polling chains (Stability, Astron) check for new blocks |

---

## How Replay Works

On startup the container scans from `replayFromBlock` to the current block in chunks of `replayBatchSize`:

```
Block 6,000,000 ──► [batch 1: 6,000,000 – 6,002,000] ──wait replayDelayMs──►
                    [batch 2: 6,002,000 – 6,004,000] ──wait replayDelayMs──►
                    ...
                    [current block]  ──► switch to live subscription
```

Reducing `replayBatchSize` means more requests, each covering fewer blocks. Adding `replayDelayMs` spaces them out so you don't burst past the RPC's per-second limit.

---

## Recommended Settings by RPC Tier

### Public / free-tier RPCs

Free public endpoints (e.g. `publicnode.com`, Infura free) typically allow 5–10 requests/second and cap `eth_getLogs` at 2,000 blocks per call.

```json
{
  "chainKey": "ethereum-sepolia",
  "rpcUrl": "wss://ethereum-sepolia-rpc.publicnode.com",
  "replayFromBlock": 6000000,
  "replayBatchSize": 500,
  "replayDelayMs": 1000,
  "confirmations": 1
}
```

### Paid RPC (e.g. Alchemy Growth / QuickNode)

Paid plans support much larger batch sizes and higher throughput.

```json
{
  "chainKey": "ethereum-sepolia",
  "rpcUrl": "wss://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}",
  "replayFromBlock": 6000000,
  "replayBatchSize": 10000,
  "replayDelayMs": 100,
  "confirmations": 1
}
```

### HTTP-polling chains (Stability, Astron)

These chains use polling instead of WebSocket subscriptions. `pollIntervalMs` controls how often new blocks are checked — set it no lower than your RPC's minimum polling window.

```json
{
  "chainKey": "stability",
  "rpcUrl": "https://rpc.stabilityprotocol.com/zgt/${STABILITY_API_KEY}",
  "replayFromBlock": 35000000,
  "replayBatchSize": 5000,
  "replayDelayMs": 5000,
  "pollIntervalMs": 10000,
  "confirmations": 1
}
```

---

## Diagnosing Rate Limit Errors

Check logs for these patterns:

| Log message | Cause | Fix |
|---|---|---|
| `missing response` / `timeout` | Batch too large, RPC dropped the connection | Lower `replayBatchSize` |
| `rate limit exceeded` / `429` | Too many requests per second | Increase `replayDelayMs` |
| `could not decode result data` | Wrong registry address or RPC returned empty | Verify `registryAddresses` and `rpcUrl` |

Enable debug logging to see each batch request:


---

## Full Example — Multi-Chain with Conservative Rate Limits

```json
{
  "chains": [
    {
      "chainKey": "ethereum-sepolia",
      "rpcUrl": "wss://ethereum-sepolia-rpc.publicnode.com",
      "registryAddresses": ["0xYourRegistryAddress"],
      "replayFromBlock": 6000000,
      "replayBatchSize": 500,
      "replayDelayMs": 1000,
      "confirmations": 1
    },
    {
      "chainKey": "polygon-amoy",
      "rpcUrl": "wss://polygon-amoy-bor-rpc.publicnode.com",
      "registryAddresses": [],
      "replayFromBlock": 39000000,
      "replayBatchSize": 1000,
      "replayDelayMs": 500,
      "confirmations": 1
    },
    {
      "chainKey": "stability",
      "rpcUrl": "https://rpc.stabilityprotocol.com/zgt/${STABILITY_API_KEY}",
      "registryAddresses": [],
      "replayFromBlock": 35000000,
      "replayBatchSize": 5000,
      "replayDelayMs": 5000,
      "pollIntervalMs": 10000,
      "confirmations": 1
    }
  ],
  "webhook": {
    "url": "https://your-system.example.com/trustvc/events"
  },
  "server": {
    "logLevel": "info"
  }
}
```
