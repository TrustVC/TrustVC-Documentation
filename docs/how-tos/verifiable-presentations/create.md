---
id: create
title: Creating a Verifiable Presentation
sidebar_label: Create a Presentation
---

import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

## Overview

`signW3CPresentation` bundles one or more signed Verifiable Credentials into an envelope and signs
it with the holder's key. It performs the checks described in
[Overview](./overview.md#the-holder-binding-rule) before signing, so a presentation it produces is
always one the holder is entitled to make.

Before starting, confirm all three of these hold — they are the checks that fail in practice:

1. Every credential's `credentialSubject.id` is the holder's DID.
2. The holder's key pair is **ECDSA (P-256)**; a BBS key cannot sign a presentation.
3. Every credential is currently valid — not expired, not revoked, and its issuer resolvable.

## Signing

<Tabs>
  <TabItem value="library" label="Using the library" default>

Install the library:

```bash
npm install @trustvc/trustvc
```

Sign the presentation:

```ts
import { signW3CPresentation } from '@trustvc/trustvc';

const { signed, error } = await signW3CPresentation(
  signedCredential,          // one credential, or an array of them
  holderKeyPair,             // the holder's did key pair (contains the private key)
  {
    holder: holderKeyPair.controller,   // must equal every credentialSubject.id
    expiresInSeconds: 600,              // or: validUntil: '2026-01-01T00:00:00Z'
  },
);

if (error) throw new Error(error);
console.log(signed);
```

The result is the presentation, ready to send:

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2", "..."],
  "type": ["VerifiablePresentation"],
  "holder": "did:key:zDnaeSSj4pMHnBjMEQHKmT2hVFNGxAujN3JXWnyDaEwrNKvxc",
  "validFrom": "2026-01-01T09:15:04.812Z",
  "validUntil": "2026-01-01T09:25:04.812Z",
  "verifiableCredential": [{ "...": "the credentials, unchanged" }],
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "ecdsa-rdfc-2019",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:key:zDnaeSSj4pMHnBjMEQHKmT2hVFNGxAujN3JXWnyDaEwrNKvxc#zDnaeSSj…",
    "proofValue": "z4oey5q2M3XKaxup3tmz…"
  }
}
```

### Presenting several credentials

Pass an array. Each one is checked and bound to the holder independently:

```ts
const { signed, error } = await signW3CPresentation(
  [billOfLading, certificateOfOrigin],
  holderKeyPair,
  { holder: holderKeyPair.controller, expiresInSeconds: 600 },
);
```

Errors name the offending credential by index, so you can tell which of several failed:

```text
credential at index 1 is about "did:key:zDnaerUv…", which does not match the holder "did:key:zDnaeSSj…"
```

  </TabItem>

  <TabItem value="cli" label="Using CLI">

Install the CLI:

```bash
npm install -g @trustvc/trustvc-cli
```

Sign the presentation:

```bash
trustvc vp-sign
```

You will be prompted to:

```text
? Please enter a directory of signed Verifiable Credentials, or the path(s) to individual JSON file(s) (comma-separated): ./credentials
? Please enter the path to the holder did key-pair JSON file: ./didKeyPairs.json
? How should the presentation expiry be set? (Use arrow keys)
  ❯ Expires in a number of seconds from now (Stamp validUntil relative to the current time)
    Explicit validUntil timestamp (Provide an absolute ISO 8601 expiry)
? Enter the presentation lifetime in seconds: 600
? Enter a directory to save the signed Verifiable Presentation (optional): .

ℹ  info      Presenting 2 credentials:
ℹ  info        [0] ./credentials/bill_of_lading.json
ℹ  info        [1] ./credentials/certificate_of_origin.json
ℹ  info      Holder: did:key:zDnaeSSj4pMHnBjMEQHKmT2hVFNGxAujN3JXWnyDaEwrNKvxc
✔  success   Verifiable Presentation signed successfully
✔  success   Signed verifiable presentation saved to: ./signed_vp.json
```

The first prompt accepts three forms:

| Answer | Result |
|---|---|
| A directory | Every file in it is presented. Dot-files and sub-directories are skipped. |
| A single file path | That one credential is presented. |
| Comma-separated paths | Exactly those credentials, in the order given. |

> **Note**: The holder DID is **not** prompted for. TrustVC requires the signing key's DID to *be*
> the holder, so any other answer could only fail — it is read from the key pair and printed, as
> above.

The key pair must be the `didKeyPairs.json` produced by
[`trustvc w3c did-web`](../issuer/did-web.md) — a file that carries a `controller`. The bare
`keypair.json` from `key-pair-generation` has no DID attached and is rejected before signing:

```text
✖  error     The key pair at ./keypair.json is not bound to a DID (no "controller").
             Create one with "trustvc did-web" and use the didKeyPairs.json it writes.
```

When a credential cannot be presented, the CLI names the **file** rather than an index, and writes
nothing:

```text
✖  error     credential at index 1 (./credentials/certificate_of_origin.json) is about
             "did:key:zDnaerUv…", which does not match the holder "did:key:zDnaeSSj…"
```

  </TabItem>
</Tabs>

## Setting the validity window

A presentation **must** have an expiry — `signW3CPresentation` refuses without one, because an
open-ended presentation would be replayable forever. Choose either form:

| Option | Meaning |
|---|---|
| `expiresInSeconds` | Relative to now. The CLI default is `600` (10 minutes). |
| `validUntil` | An absolute ISO 8601 timestamp. Must be in the future. |

Keep it short. A presentation is made for one exchange, so its window should cover that exchange
and no more. The credentials inside are unaffected — they keep their own, much longer validity.

### `validFrom` is stamped, not chosen

The opening edge of the window is set for you: `resolveVpValidity` defaults it to the signing
moment, and `createPresentation` writes it onto every presentation. You cannot omit it, and you
cannot remove it afterwards — it is inside the signed payload, so deleting it invalidates the
holder's proof.

Through the CLI you are only ever asked how the window **closes**. So a presentation's `validFrom`
is a record of when it was signed, not a scheduling control, and a "not yet valid" presentation is
not a state an honest document reaches.

:::note
A *credential's* `validFrom` is different — it is chosen by its issuer and can legitimately sit in
the future. Such a credential cannot be presented until it becomes valid.
:::

## Common signing failures

Every one of these refuses to sign and writes nothing, by design.

| Error | Cause | Fix |
|---|---|---|
| `is about "did:key:…", which does not match the holder "did:key:…"` | The credential's subject is somebody else. | Present a credential about the holder, or use the key pair of the credential's actual subject. |
| `has no "credentialSubject.id", so it cannot be bound to the holder.` | The credential was issued without a subject id. | Reissue it with `credentialSubject.id` set. It cannot be fixed after issuance. |
| `has expired (…)` | The credential's `validUntil` has passed. | Ask the issuer to reissue. Re-presenting cannot help. |
| `has been revocation (credentialStatus).` | The credential is revoked on its status list. | Ask the issuer. A revoked credential can never be presented. |
| `has a "TransferableRecords" credentialStatus and cannot be included in a Verifiable Presentation.` | Ownership of a transferable record lives on-chain, not in a presentation. | Present it through its token ownership instead. |
| `is not valid: Invalid signature.` | The credential was edited after signing. | Re-sign from the original source data. |
| `each credential must be a signed credential object (with a "proof").` | The input is a raw, unsigned credential. | Sign the credential first. |
| `An ECDSA (P-256) Multikey is required to sign a presentation with "ecdsa-rdfc-2019".` | The holder key pair is BBS, or the key material is unreadable. | Use an ECDSA (P-256) holder key. The credentials inside may still be BBS. |
| `a VP lifetime is required: pass "expiresInSeconds" or "validUntil".` | No expiry was given. | Set one of the two. |

## Try it

The TrustVC CLI ships a generator that mints a complete, runnable set — a holder key, presentable
credentials, and one presentation per outcome — so you can reproduce every case above and every
verification result on the next page without issuing anything yourself:

```bash
git clone https://github.com/TrustVC/trustvc-cli
cd trustvc-cli && npm install && npm run build
node tests/fixtures/vp/generate.cjs
```

That writes `tests/fixtures/vp/`, laid out so a file's expected outcome is readable from its path —
`credentials/presentable/` and `credentials/rejected/`, `presentations/valid/` and
`presentations/invalid/`. The folder's own `README.md` documents the exact message each file
produces. Point `trustvc vp-sign` and `trustvc verify` at them.

## Next steps

- **[Verifying a Verifiable Presentation](./verify.md)** — what each fragment covers, and how to
  read a failure.
