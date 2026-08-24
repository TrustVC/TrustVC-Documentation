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

**Use the holder's existing key, not a new one.** The key you sign with fixes the DID that goes
into `holder`, and that must be the `credentialSubject.id` the issuer named — a fresh key is a
fresh DID and would match nothing. The identity comes first: you hold a DID, credentials are issued
to it, and you present them later with the same key. Generating keys belongs to
[setting up that identity](../issuer/did-web.md), not to presenting.

The file has to be **bound to a DID** — it carries a `controller`, which is the holder DID the
presentation will claim. Both DID methods give you one:

| Holder DID | Where the key pair comes from |
|---|---|
| `did:web` | `trustvc did-web` writes `didKeyPairs.json`, with `controller` set to the `did:web`. |
| `did:key` | `issuer.generateDidKeyPair()` in the library returns one, with `controller` set to the `did:key`. The CLI has no did:key command, so generate it with the library and pass the file here. |

What is **not** accepted is the bare `keypair.json` from `key-pair-generation`: it is key material
only — `type`, `publicKeyMultibase`, `secretKeyMultibase` — with no DID attached, so there is no
holder to bind to.

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

The opening edge of the window is set for you — it is the moment of signing. Every presentation
gets one, you cannot omit it, and you cannot remove it afterwards: it sits inside the signed
payload, so deleting it invalidates the holder's proof.

You are only ever asked how the window **closes**. So a presentation's `validFrom` records when it
was signed rather than scheduling when it becomes usable, and a "not yet valid" presentation is not
a state an honest document reaches.

:::note
A *credential's* `validFrom` is different — it is chosen by its issuer and can legitimately sit in
the future. Such a credential cannot be presented until it becomes valid.
:::

## Common signing failures

Signing is refused rather than producing a presentation that could not be verified, and **nothing
is written** when it fails. Every refusal names the credential responsible **by its index** in the
list you passed, so with several credentials you can tell which one is at fault — and the CLI names
the **file** it came from as well.

The refusals fall into two groups.

### The credential cannot be bound to this holder

| What went wrong | Fix |
|---|---|
| The credential is about somebody else — its `credentialSubject.id` is not the holder. | Present a credential whose subject is the holder, or sign with the key pair of the credential's actual subject. |
| The credential has no `credentialSubject.id` at all, so there is nothing to bind. | Reissue it with a subject id. Selective disclosure keeps an id that was present at issuance, so this cannot be fixed afterwards. |
| The declared holder is not the signing key's DID. | Set `holder` to the DID of the key you are signing with — through the CLI this is automatic. |

### The credential is not currently presentable

| What went wrong | Fix |
|---|---|
| It has expired. | Ask the issuer to reissue. Re-presenting cannot help — only the issuer can extend a credential's life. |
| It is not yet valid — its `validFrom` is in the future. | Wait until it becomes valid, or ask the issuer. |
| It has been revoked or suspended on its status list. | Ask the issuer. A revoked credential can never be presented. |
| It is a **transferable record** — its `credentialStatus` is `TransferableRecords`. | Present it through its token ownership instead. Ownership lives on-chain, not in a presentation. |
| It is unsigned — a raw credential with no `proof`. | Sign the credential first. |
| It was edited after signing, so its own signature no longer verifies. | Re-sign from the original source data. Never edit a signed credential. |
| Its issuer's DID cannot be resolved, so its signature cannot be checked. | Publish or restore the issuer's DID document. |

Two failures are about the presentation rather than a credential:

| What went wrong | Fix |
|---|---|
| The holder key is not ECDSA (P-256) — a BBS key, or unreadable key material. | Use an ECDSA holder key. The **credentials** inside may still be BBS; only the holder's key is constrained. |
| No expiry was given, or `validUntil` is not after `validFrom`. | Set `expiresInSeconds` or a future `validUntil`. |

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
