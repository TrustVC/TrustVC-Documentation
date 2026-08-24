---
id: verify
title: Verifying a Verifiable Presentation
sidebar_label: Verify a Presentation
---

import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

## Overview

Presentations are verified with the same entry point as everything else —
[`verifyDocument`](../verifydocument.md). It detects that the document is a presentation and runs
the presentation verifiers, returning the same three fragment types you already handle.

There is no separate `vp-verify` command, and you do not need to unwrap the presentation yourself.

<Tabs>
  <TabItem value="library" label="Using the library" default>

```ts
import { verifyDocument, isValid } from '@trustvc/trustvc';

const fragments = await verifyDocument(signedPresentation);

console.log(isValid(fragments)); // true only if every check passed

for (const fragment of fragments) {
  console.log(`${fragment.type}: ${fragment.status}`);
  if (fragment.status !== 'VALID') console.log('  ', fragment.reason?.message);
}
```

  </TabItem>

  <TabItem value="cli" label="Using CLI">

```bash
trustvc verify
```

```text
? Please enter the path to your document: ./signed_vp.json

ℹ  info      Verifying W3C Verifiable Presentation...
✔  success   DOCUMENT_INTEGRITY: VALID
✔  success   DOCUMENT_STATUS: VALID
✔  success   ISSUER_IDENTITY: VALID
ℹ  info      2 embedded credentials verified.
```

The final line appears only when the presentation is valid. The three status lines read
identically whether one credential was checked or five, so the count states what they cannot.

  </TabItem>
</Tabs>

## What each fragment covers

The three fragment types are the same as for a credential, but each one covers more ground, because
a presentation contains credentials **and** a holder's claim to them.

### DOCUMENT_INTEGRITY

Everything signature-related, at both levels:

- The **holder's proof** over the presentation verifies.
- **Holder binding** holds — the signer's DID matches the declared `holder`.
- Each **embedded credential's own issuer signature** verifies.

`VALID` here means: nothing has been altered since signing, and the party presenting is the party
named as holder.

```ts
const integrity = fragments.find((f) => f.type === 'DOCUMENT_INTEGRITY');
// fragment.name === 'W3CVpSignatureIntegrity'
// fragment.data.credentialResults — one entry per embedded credential
```

### DOCUMENT_STATUS

Everything time- and revocation-related, again at both levels:

- The **presentation's** own validity window (`validUntil`).
- Each **embedded credential's** window — expired, or not yet valid.
- Each **embedded credential's** revocation status, resolved from its status list.

`VALID` here means: the presentation is still within its window, and every credential inside is
still in force.

### ISSUER_IDENTITY

Every embedded credential's **issuer** resolves and is trusted — the issuer DID document can be
fetched and lists the signing key. Also fails if the presentation carries no credentials at all,
since there is then no issuer to identify.

:::note
`ISSUER_IDENTITY` concerns the credentials' **issuers**, never the presentation's holder. The
holder is checked by `DOCUMENT_INTEGRITY`, because holder binding is part of what the proof
asserts.
:::

## Reading a failure

Fragment statuses are the same four values as for credentials: `VALID`, `INVALID`, `SKIPPED`,
`ERROR`. See [Fragment Statuses](../verifydocument.md#fragment-statuses).

What matters for a presentation is **which of the two levels failed**, because the remedy differs.
The message tells you; the fragment type alone does not.

| Message | Fragment | What went wrong | Who can fix it |
|---|---|---|---|
| `Presentation has expired (validUntil …)` | `DOCUMENT_STATUS` | The presentation's own window closed. The credentials may be perfectly valid. | **The holder** — sign a new presentation. |
| `Embedded credential at index N has expired (validUntil …)` | `DOCUMENT_STATUS` | A credential inside has passed its own expiry. | **The issuer** — the credential must be reissued. Re-presenting cannot help. |
| `Embedded credential at index N is not yet valid (validFrom …)` | `DOCUMENT_STATUS` | A credential's window has not opened yet. | **The issuer**, or wait until it becomes valid. |
| `Embedded credential at index N has been revoked (status purpose "revocation")` | `DOCUMENT_STATUS` | A credential was revoked on its status list, most likely after the presentation was signed. | **The issuer** — nothing the holder does will change it. |
| `Presentation is not signed (no holder "proof"), so ownership cannot be proven.` | `DOCUMENT_INTEGRITY` | The envelope has no holder proof. Authentic credentials, unproven ownership. | **The holder** — sign the presentation. |
| `Invalid signature.` | `DOCUMENT_INTEGRITY` | Something inside the signed payload was edited after signing — a credential field, or the `holder` value. | **The holder** — re-sign from the original credentials. Do not edit a signed presentation. |
| `the presentation was signed by "did:key:…", which does not match the declared holder "did:key:…"` | `DOCUMENT_INTEGRITY` | The signature is genuine but belongs to someone other than the declared holder. | **The holder** — present with the key matching the credentials' subject. |
| `Could not resolve issuer(s): index N (did:web:…)` | `ISSUER_IDENTITY` | An embedded credential names an issuer whose DID document cannot be fetched. | **The issuer** — publish or restore the DID document. |
| `Presentation contains no verifiable credentials.` | `ISSUER_IDENTITY` | The `verifiableCredential` array is empty. | **The holder** — present at least one credential. |

### Do not collapse the two expiries

`Presentation has expired` and `Embedded credential … has expired` land on the **same fragment** and
read almost identically, but they need **opposite** remedies:

- An **expired presentation** is the holder's to fix — they sign a fresh one, and the credentials
  inside are untouched.
- An **expired credential** is the issuer's to fix — the holder can re-present forever and it will
  keep failing.

If you surface verification results to users, branch on the message, not just the fragment type. A
UI that reports both as *"this has expired, ask the holder to present again"* sends people to the
wrong party for half of these cases.

The same applies to revocation: a revoked credential inside a valid presentation is **not** a
tampered document. The holder's proof is sound; a credential simply went bad afterwards. Reporting
it as tampering is both wrong and unactionable.

### An unresolvable issuer also fails integrity

When an embedded credential's issuer cannot be resolved, expect **two** failures:
`ISSUER_IDENTITY: INVALID` *and* `DOCUMENT_INTEGRITY: INVALID`. That is not a second, separate
problem — verifying a credential's signature requires the issuer's public key, which is exactly
what could not be fetched.

Report the issuer failure as the cause. The integrity failure is a symptom of it, and calling it
tampering is misleading.

## An expired credential inside a valid presentation

This is the case most worth testing against, because it is the one that is easy to report wrongly:

```text
ℹ  info      Verifying W3C Verifiable Presentation...
✔  success   DOCUMENT_INTEGRITY: VALID
⚠  warning   DOCUMENT_STATUS: INVALID - Embedded credential at index 0 has expired (validUntil 2026-01-01T09:25:04.812Z).
✔  success   ISSUER_IDENTITY: VALID
```

`DOCUMENT_INTEGRITY` stays `VALID`, and that is correct: the signature is sound, the holder is who
they claim to be, nothing was altered. A credential simply expired after the presentation was made.
The document is not broken — a claim inside it is no longer current.

## Verifying credentials individually

The presentation's fragments are the source of truth for the overall verdict — only they check the
holder's proof and holder binding. If you also want a per-credential verdict, for example to show
one row per credential in a UI, extract the credentials and verify each on its own:

```ts
const credentials = [signedPresentation.verifiableCredential].flat();

const perCredential = await Promise.all(
  credentials.map((credential) => verifyDocument(credential)),
);
```

Be aware of what this cannot see: a credential verified in isolation has no holder proof and no
holder binding, so a set of individually-valid credentials says nothing about who is presenting
them. Use it for display, not for the decision.

## Try it

The CLI ships one presentation per outcome — valid, expired at each level, revoked, tampered,
unsigned, holder-mismatched, unresolvable issuer — so every row of the failure table above can be
reproduced:

```bash
git clone https://github.com/TrustVC/trustvc-cli
cd trustvc-cli && npm install && npm run build
node tests/fixtures/vp/generate.cjs

trustvc verify   # → tests/fixtures/vp/presentations/invalid/credential_expired.json
```

Anything under `presentations/invalid/` must fail, and the filename says how. That folder's
`README.md` records the exact message each one produces.
