---
id: quick-start
title: Quick Start
sidebar_label: Quick Start
sidebar_position: 2
---

# Quick Start

Get `trustvc-chain-events` running locally in under 5 minutes.

---

## Step 1 — Pull the Image

```bash
docker pull ghcr.io/trustvc/trustvc-chain-events:latest
```

---

## Step 2 — Generate a Signing Key

The container signs every webhook delivery with an **Ed25519** key. You keep the private key; your receiver uses the public key to verify payloads.

**Option A — random seed (simplest)**

```bash
openssl rand -base64 32
# example output: cZejchTTcxHUk8N+sbcOyVHZ3MVxzYQGYDCn+hFa4S4=
# Paste this value as SIGNING_PRIVATE_KEY in your .env
```

**Option B — PEM key pair (keep the public key for verification)**

```bash
openssl genpkey -algorithm ed25519 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem

# Extract the 32-byte seed the container expects:
openssl pkey -in private.pem -outform DER | tail -c 32 | base64
# Paste this output as SIGNING_PRIVATE_KEY in your .env
```

:::important
`SIGNING_PRIVATE_KEY` must be the **raw 32-byte Ed25519 seed encoded as base64** — not the PEM file itself. Use the extraction command above if you generated a PEM key.
:::

---

## Step 3 — Create `config.json`

Create a `config.json` in your working directory. At a minimum you need a chain, an RPC URL, and a webhook URL.

<a href="/docs/chain-events/config.example.json" download="config.json" className="button button--primary button--md">Download config.json example</a>

<br/><br/>

```json
{
  "chains": [
    {
      "chainKey": "ethereum-sepolia",
      "rpcUrl": "wss://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY",
      "registryAddresses": ["0xYourTokenRegistryAddress"],
      "replayFromBlock": 6000000
    }
  ],
  "webhook": {
    "url": "https://your-system.example.com/trustvc/events"
  }
}
```

:::tip Finding your `replayFromBlock`
Set this to the block number when your Token Registry was deployed. The container replays all events from that block on first start to catch up. Using `0` works but will scan the entire chain history.
:::

You can leave `registryAddresses` as an empty array `[]` and add them later via the [Registry API](./registry-api) — useful when you do not know addresses at deploy time.

---

## Step 4 — Create `.env`

```bash
# .env
SIGNING_PRIVATE_KEY="cZejchTTcxHUk8N+sbcOyVHZ3MVxzYQGYDCn+hFa4S4="

# Optional — PostgreSQL for state persistence
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trustvcevents
DB_USER=postgres
DB_PASSWORD=secret
```

---

## Step 5 — Run

**With an env file (recommended)**

```bash
docker run -d \
  -v $(pwd)/config.json:/app/config.json:ro \
  --env-file .env \
  -p 8080:8080 \
  --name trustvc-events \
  ghcr.io/trustvc/trustvc-chain-events:latest
```

**With Docker Compose**

```yaml title="docker-compose.yml"
services:
  trustvc-events:
    image: ghcr.io/trustvc/trustvc-chain-events:latest
    ports:
      - "8080:8080"
    volumes:
      - ./config.json:/app/config.json:ro
    env_file:
      - .env
    restart: unless-stopped
```

```bash
docker compose up -d
```

---

## Step 6 — Verify

```bash
curl http://localhost:8080/health
```

```json
{"status":"ok"}
```

Check the logs to confirm chains are connected and escrows are loaded:

```bash
docker logs trustvc-events
```

You should see output similar to:

```text
INFO [startup]: trustvc-webhook-events starting  version: "0.1.0"
INFO [startup]: Database connected
INFO [startup]: Chain worker ready  chain: "ethereum-sepolia"  escrows: 22
INFO [startup]: ✓ Server ready — listening for on-chain events
    chains: "ethereum-sepolia (22 escrows)"
    webhook: "https://your-system.example.com/trustvc/events"
```

:::note Chain worker shows 0 escrows?
If you see `escrows: 0` in the "Chain worker ready" line but the final "Server ready" line shows the correct count, this is a display-only race condition in startup logging — the container is working correctly. The definitive count is always in the final summary.
:::

---

## What Happens Next

Once running, the container:

1. **Replays history** — scans from `replayFromBlock` to the current block to catch any events you missed
2. **Subscribes to live blocks** — uses WebSocket subscriptions (or polling for HTTP-transport chains) to receive new events in real time
3. **Signs and delivers** — each event is signed with your Ed25519 key and POSTed to your webhook URL
4. **Retries on failure** — uses exponential backoff (configurable via `retryAttempts` and `retryBackoffMs`)

See [Webhook Payload & Verification](./webhook-payload) for the full event schema and how to verify signatures on your receiver.
