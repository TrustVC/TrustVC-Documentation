---
id: registry-api
title: Registry API
sidebar_label: Registry API
sidebar_position: 5
---

# Registry API

The container exposes a REST API on port `8080` that lets you add and remove Token Registry contracts at runtime — without restarting the container or editing `config.json`.

:::note Database required
All registry management endpoints require `DB_HOST` to be configured. They return `503 Service Unavailable` if no database is connected. Registries added via the API are persisted to the database and survive container restarts.
:::

---

## Health Check

```bash
GET /health
```

```bash
curl http://localhost:8080/health
```

```json
{"status":"ok"}
```

| `status` | Meaning | HTTP |
|---|---|---|
| `ok` | All chains connected and ready | `200` |
| `starting` | At least one chain still connecting | `200` |
| `degraded` | At least one chain permanently failed | `503` |

---

## Add a Registry

```bash
POST /registry
Content-Type: application/json
```

```bash
curl -X POST http://localhost:8080/registry \
  -H 'Content-Type: application/json' \
  -d '{
    "chainKey": "ethereum-sepolia",
    "address": "0xYourTokenRegistryAddress",
    "fromBlock": 6000000
  }'
```

### Request Body

| Field | Required | Description |
|---|---|---|
| `chainKey` | **Yes** | Must match a `chainKey` in your running `config.json` |
| `address` | **Yes** | EVM address of the Token Registry contract |
| `fromBlock` | No | Block to replay history from (default: `0`) — set to your registry's deployment block |

### Responses

| HTTP | Meaning |
|---|---|
| `200` | Registry added and syncing — historical events are replaying in the background |
| `400` | Missing or invalid fields |
| `422` | Address is not a deployed TrustVC registry on that chain |
| `503` | Database not configured |

:::tip Set `fromBlock` accurately
If you omit `fromBlock` or pass `0`, the container scans from the chain genesis — this can take a long time. Always pass the block number when your registry was deployed.
:::

---

## List Registries

```bash
GET /registries
```

```bash
curl http://localhost:8080/registries
```

```json
[
  {
    "chainKey": "ethereum-sepolia",
    "address": "0xe6b5ce7e3691a0927b2806ce6638b35237dffac4",
    "fromBlock": 6000000,
    "addedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

## Remove a Registry

```bash
DELETE /registry/:chainKey/:address
```

```bash
curl -X DELETE \
  http://localhost:8080/registry/ethereum-sepolia/0xe6b5ce7e3691a0927b2806ce6638b35237dffac4
```

| HTTP | Meaning |
|---|---|
| `200` | Registry removed — no further events will be delivered for this registry |
| `404` | Registry not found |
| `503` | Database not configured |

---

## Workflow Example

A common pattern is to start the container with an empty `registryAddresses: []` in `config.json`, then add registries as they are deployed.

**Step 1 — Start the container**

```bash
docker run -d \
  -v $(pwd)/config.json:/app/config.json:ro \
  --env-file .env \
  -p 8080:8080 \
  ghcr.io/trustvc/trustvc-chain-events:latest
```

**Step 2 — Deploy your Token Registry**

Deploy your Token Registry contract and note the contract address and deployment block number.

**Step 3 — Register it**

```bash
curl -X POST http://localhost:8080/registry \
  -H 'Content-Type: application/json' \
  -d '{
    "chainKey": "ethereum-sepolia",
    "address": "0xYourRegistryAddress",
    "fromBlock": 6000000
  }'
```

Events start flowing immediately once the registry is added.

**Step 4 — Confirm it is active**

```bash
curl http://localhost:8080/registries
```
