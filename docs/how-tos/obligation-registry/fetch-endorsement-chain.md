---
id: fetch-endorsement-chain
title: fetchEndorsementChain
sidebar_label: Fetch Endorsement Chain
---

### Description

`fetchEndorsementChain` is the same function used for classic ETR — it auto-detects whether a title's escrow is a `TitleEscrow` (V4/V5) or an `ObligationEscrow`, and returns the right kind of history either way. For Obligation Registry titles, the returned chain also includes the status events — `StatusInitialized`, `StatusAccepted`, `StatusRejected`, `StatusDischarged`, and `Shred` — alongside the usual transfer events.

> There is no separate "obligation" version of this function — always call `fetchEndorsementChain`. See the [trustvc SDK README — Obligation Registry (BoE)](https://github.com/TrustVC/trustvc/blob/main/README.md#c-obligation-registry-boe) for the full endorsement-chain notes.
   
### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| tokenRegistry | string | The address of the Obligation Registry (`TrustVCToken`) contract. |
| tokenId | string | The unique identifier of the token. |
| provider | Provider | A blockchain provider to interact with the smart contracts. |
| keyId (optional) | string | The key used for decrypting remarks. |

### Returns

A Promise `<EndorsementChain>` that resolves to an array of events representing the document's full on-chain history — transfers and status changes, in order.

### Example Usage

The `keyId` below must match whatever key was passed as `id` when the remark was encrypted (e.g. at mint time) -- it isn't an arbitrary string you can pick freely at read time. The convention used throughout these docs, shown in the next example, is to use the document's own `id` as this key.

```typescript
import { fetchEndorsementChain } from "@trustvc/trustvc";

const endorsementChain = await fetchEndorsementChain(
  "0x123456...", // Obligation Registry address
  "0x12345", // Token ID
  provider, // Web3 Provider
  "my-decryption-key", // Must match the key used to encrypt remarks -- see note above
);
console.log(endorsementChain);
```

Considering a case where you have a Bill of Exchange VC:

```typescript
const file = event.dataTransfer.files[0];
// considering the VC is the file dropped in the drop box
try {
  const fileContent = await file.text();
  const vc = JSON.parse(fileContent);
  const _provider = new ethers.providers.JsonRpcProvider(rpc);
  // fetch endorsement chain — note credentialStatus.obligationRegistry, not tokenRegistry
  const _endorsementChain = await fetchEndorsementChain(
    vc.credentialStatus.obligationRegistry,
    "0x" + vc.credentialStatus.tokenId,
    _provider as any,
    vc.id,
  );
  console.log("Endorsement Chain", _endorsementChain);
} catch (error) {
  console.error(error);
}
```

### Using the CLI

If you don't want to call the SDK function directly, the CLI wraps the same lookup:

> **Version note**: These commands require `@trustvc/trustvc-cli@1.3.0-beta.3` or later -- see [Deployment](./deployment#installing-trustvc-cli) for installation.

```bash
# Full history — transfers and status events
trustvc obligation-escrow endorsement-chain

# A single, current snapshot instead of the full history
trustvc obligation-escrow status
```

Both commands are **read-only** — no wallet or private key is requested. They extract the network, `obligationRegistry` address, and token ID from the document you point them at, and decrypt remarks using the document's `id`.

`trustvc obligation-escrow status` output includes the current `status` (`Issued` / `Accepted` / `Rejected` / `Discharged`), whether the title is registered, the termination reason (if the title has been closed), and the escrow's beneficiary/holder/nominee.

### Error Handling

- Throws if `tokenRegistry`, `tokenId`, or `provider` is missing.
- Throws if the registry address and token ID can't be resolved to an escrow contract at all (e.g. a wrong registry address, or a token ID that was never minted there).
- Throws `Only Token Registry V4/V5 or Obligation Registry is supported` if the resolved escrow contract doesn't implement Title Escrow V4/V5 or Obligation Escrow — double-check you're passing the Obligation Registry address, not a classic Token Registry address.
