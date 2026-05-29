---
id: webhook-payload
title: Webhook Payload & Verification
sidebar_label: Webhook Payload
sidebar_position: 4
---

# Webhook Payload & Verification

Every event is delivered as an HTTP `POST` to your configured `webhook.url`.

---

## Request Format

```text
POST /your-endpoint
Content-Type: application/json
X-TrustVC-Signature: ed25519=<base64url-signature>
```

The body follows the [CloudEvents 1.0](https://cloudevents.io/) specification:

```json
{
  "specversion": "1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "urn:trustvc:11155111:0xe6b5ce7e3691a0927b2806ce6638b35237dffac4",
  "type": "com.trustvc.etr.holder_transfer",
  "datacontenttype": "application/json",
  "time": "2024-01-15T10:31:00.000Z",
  "subject": "1",
  "data": {
    "chainKey": "ethereum-sepolia",
    "chainId": 11155111,
    "registryAddress": "0xe6b5ce7e3691a0927b2806ce6638b35237dffac4",
    "tokenId": "1",
    "blockNumber": 6123456,
    "transactionHash": "0xabcdef...",
    "logIndex": 0,
    "payload": {
      "fromHolder": "0xSenderAddress",
      "toHolder": "0xReceiverAddress"
    }
  }
}
```

### Top-Level Fields

| Field | Description |
|---|---|
| `specversion` | Always `"1.0"` |
| `id` | UUID — globally unique event identifier |
| `source` | `urn:trustvc:<chainId>:<registryAddress>` |
| `type` | Event type — see [Event Types](#event-types) below |
| `time` | ISO-8601 block timestamp |
| `subject` | Token ID as a string |
| `data` | Event-specific payload — see below |

### `data` Fields

| Field | Description |
|---|---|
| `chainKey` | Chain identifier (e.g. `ethereum-sepolia`) |
| `chainId` | Numeric EIP-155 chain ID |
| `registryAddress` | Token Registry contract address (lowercase) |
| `tokenId` | ETR token ID as a string |
| `blockNumber` | Block the event was confirmed in |
| `transactionHash` | Transaction that emitted the event |
| `logIndex` | Log index within the transaction |
| `payload` | Event-specific data (addresses, amounts, etc.) |

:::tip Idempotency
Use `data.transactionHash + data.logIndex` as your idempotency key — this combination uniquely identifies any on-chain event.
:::

---

## Event Types

| `type` | Trigger | Key `payload` fields |
|---|---|---|
| `com.trustvc.etr.minted` | Token minted | `tokenId`, `owner` |
| `com.trustvc.etr.burned` | Token burned | `tokenId` |
| `com.trustvc.etr.surrendered` | Token surrendered to registry | `tokenId` |
| `com.trustvc.etr.restored` | Token restored from registry | `tokenId` |
| `com.trustvc.etr.registry_paused` | Registry paused | — |
| `com.trustvc.etr.registry_unpaused` | Registry unpaused | — |
| `com.trustvc.etr.escrow_created` | New TitleEscrow deployed | `escrowAddress` |
| `com.trustvc.etr.token_received` | Escrow took custody | `escrowAddress` |
| `com.trustvc.etr.nomination` | Beneficiary nominee set | `nominee` |
| `com.trustvc.etr.beneficiary_transfer` | Beneficiary transferred | `fromBeneficiary`, `toBeneficiary` |
| `com.trustvc.etr.holder_transfer` | Holder transferred | `fromHolder`, `toHolder` |
| `com.trustvc.etr.return_to_issuer` | Token returned to issuer | — |
| `com.trustvc.etr.shred` | Token permanently destroyed | — |
| `com.trustvc.etr.reject_transfer_beneficiary` | Beneficiary transfer rejected | — |
| `com.trustvc.etr.reject_transfer_holder` | Holder transfer rejected | — |
| `com.trustvc.etr.reject_transfer_owners` | Both roles rejected simultaneously | — |

---

## Signature Verification

Every request includes an `X-TrustVC-Signature` header:

```text
X-TrustVC-Signature: ed25519=<base64url-signature>
```

The signature is computed over the **raw request body bytes** using the Ed25519 private key configured in `SIGNING_PRIVATE_KEY`. Your receiver verifies it with the corresponding public key — the public key cannot forge payloads even if your receiver is compromised.

:::important Verify on raw bytes
Parse the signature header before parsing the JSON body. Always verify the signature against the raw, unparsed body bytes — not a re-serialized object.
:::

### Node.js / TypeScript

```typescript
import crypto from 'node:crypto';
import fs from 'node:fs';

const publicKey = crypto.createPublicKey(fs.readFileSync('public.pem'));

function verifyTrustVCWebhook(rawBody: Buffer, signatureHeader: string): boolean {
  const b64url = signatureHeader.replace('ed25519=', '');
  const signature = Buffer.from(b64url, 'base64url');
  return crypto.verify(null, rawBody, publicKey, signature);
}

// Express example
app.post('/trustvc/events', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifyTrustVCWebhook(req.body, req.headers['x-trustvc-signature'] as string)) {
    return res.status(401).send('Invalid signature');
  }
  const event = JSON.parse(req.body.toString());
  // handle event...
  res.status(200).send('ok');
});
```

### Python

```python
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature

with open('public.pem', 'rb') as f:
    public_key = load_pem_public_key(f.read())

def verify_trustvc_webhook(raw_body: bytes, signature_header: str) -> bool:
    b64url = signature_header.replace('ed25519=', '')
    # base64url → standard base64
    padding = '=' * (-len(b64url) % 4)
    signature = base64.b64decode(b64url.replace('-', '+').replace('_', '/') + padding)
    try:
        public_key.verify(signature, raw_body)
        return True
    except InvalidSignature:
        return False
```

### Getting the Public Key

If you generated the key with `openssl rand -base64 32` (a raw seed), derive the public key:

```bash
# Convert raw seed to PEM private key, then extract public key
echo "YOUR_BASE64_SEED" | base64 -d > seed.bin
openssl pkey -inform DER -in <(printf '\x30\x2e\x02\x01\x00\x30\x05\x06\x03\x2b\x65\x70\x04\x22\x04\x20'; cat seed.bin) -pubout -out public.pem
```

If you generated with `openssl genpkey`, you already have `public.pem` from [Quick Start Step 2](./quick-start#step-2--generate-a-signing-key).
