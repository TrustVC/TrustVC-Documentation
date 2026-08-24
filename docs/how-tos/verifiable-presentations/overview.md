---
id: overview
title: Verifiable Presentations
sidebar_label: Overview
---

## Overview

A **Verifiable Presentation (VP)** is a signed envelope that wraps one or more Verifiable
Credentials and proves who is presenting them. The credentials inside are still signed by their
issuers; the presentation adds a second, separate signature from the **holder** — the person or
organisation handing them over.

That second signature is the whole point. A Verifiable Credential proves *who issued a claim*. It
does not prove *who is showing it to you*: a signed credential is a file, and a file can be
forwarded, copied or replayed by anyone who obtains it. A presentation closes that gap by having
the holder sign, at the moment of presenting, over the credentials being presented.

```text
Verifiable Presentation                     ← signed by the HOLDER
├── proof                                     holder's signature over everything below
├── holder: did:key:zDnae…                    who is presenting
└── verifiableCredential
    ├── Credential A                        ← signed by ISSUER A
    └── Credential B                        ← signed by ISSUER B
```

Verification therefore answers one more question than credential verification does:

1. **Integrity** — has anything been tampered with since it was signed?
2. **Status** — are the credentials still in force (not expired, not revoked)?
3. **Identity** — are the issuers who they claim to be?
4. **Ownership** — is the party presenting these credentials the party they are about?

## The holder-binding rule

TrustVC enforces a strict rule, and it is the single most common reason signing a presentation
fails:

> **Every credential in the presentation must be about the holder, and the holder must be the
> signer.** For each credential, `credentialSubject.id` must equal the presentation's `holder`,
> which must equal the DID of the key that signs the presentation.

```text
credentialSubject.id  ==  holder  ==  DID of the signing key
```

A credential naming somebody else cannot be presented by you, even though it is perfectly valid on
its own. That is deliberate: a presentation asserts *"these credentials are mine"*, so presenting a
credential about a third party would be a false claim, not a technical limitation.

Two consequences worth knowing before you start:

- **The issuer is irrelevant to holder binding.** A credential issued by anyone can be presented,
  as long as its subject is you. In practice the issuer is usually a different party — a bank, a
  carrier, an authority.
- **A credential with no `credentialSubject.id` can never be presented.** There is nothing to bind
  it to, and the id cannot be added after issuance — the credential has to be reissued.

## When to use one

Use a presentation whenever the recipient needs to know that the sender is the legitimate holder,
not merely that a document is authentic:

- A bank asked for a bill of lading and needs to know the trader sending it actually holds it.
- A counterparty needs several credentials at once — a certificate of origin and a bill of lading
  — bundled and attributable to one party.

If you only need to prove a document is authentic and unmodified, a Verifiable Credential on its
own is enough. Reach for a presentation when **ownership** matters.

## Prerequisites

To create a presentation you need:

| Requirement | Detail |
|---|---|
| **The holder's existing DID and key pair** | The private key signs the presentation. It must be the DID the credentials were issued to — not a key generated for the occasion, since a new key is a new DID and would match nothing. Either a `did:key` or a [published `did:web`](../issuer/did-web.md). |
| **An ECDSA (P-256) holder key** | Presentation proofs use the `ecdsa-rdfc-2019` cryptosuite, which requires an ECDSA key. A BBS key **cannot** sign a presentation. |
| **One or more signed credentials about that holder** | Each with `credentialSubject.id` equal to the holder DID. |
| **An expiry** | Either a lifetime in seconds or an explicit `validUntil`. A presentation cannot be open-ended. |

The **credentials** inside may use any supported cryptosuite, and they may differ from each other —
one `ecdsa-sd-2023` credential and one `bbs-2023` credential in the same presentation is valid. Only
the holder's own key is constrained to ECDSA. So a BBS-issued credential is fine; it just needs the
ECDSA holder as its subject.

## The presentation lifecycle

This is the W3C-aligned flow, and where each participant's signature enters:

```text
1. ISSUE      Issuer signs a credential about the holder
              credentialSubject.id = holder's DID
                        │
                        ▼
2. HOLD       Holder stores it — in a wallet, or as a file
                        │
                        ▼
3. PRESENT    Holder bundles the credentials and signs the envelope
              → a Verifiable Presentation
                        │
                        ▼
4. VERIFY     Verifier checks issuer signatures, credential status,
              the holder's proof, and holder binding
```

Steps 1, 2 and 4 are unchanged from ordinary credential workflows — a presentation only adds
step 3.

### Where a wallet fits

In the full W3C model, step 2 is a **wallet**: the holder's key never leaves it, and the wallet
performs step 3 on request, signing a fresh presentation for each verifier that asks. The
credentials are stored once; the presentation is created per request and short-lived.

TrustVC supports the same shape without requiring a wallet application. The holder's key pair is a
file, and you create the presentation with the library or the CLI. The trust model is identical —
the holder's private key signs, and the verifier checks that signature against the holder's DID.
The only difference is where the key is kept.

Two properties of that model are worth carrying over even without a wallet:

- **Presentations are short-lived by design.** A presentation is made for one exchange, and its
  expiry should reflect that — minutes, not months. TrustVC's default is 600 seconds. The
  credentials inside keep their own, much longer validity.
- **Presentations are made per verifier, not stored.** Create one when you need to hand credentials
  over; do not treat it as a document to archive and resend. Re-presenting means signing again.

:::note
A presentation's `validFrom` is stamped at the moment of signing and is not something you choose —
see [Creating a Verifiable Presentation](./create.md). Only the closing edge of the window is
yours to set.
:::

### Anti-replay: challenge and domain

The W3C model also allows a verifier to send a **challenge** (a nonce) that the holder signs into
the presentation, so a captured presentation cannot be replayed to a different verifier. This
requires the verifier to issue the challenge and later check it, which makes it a property of an
interactive exchange rather than of the document.

TrustVC signs presentations with an `assertionMethod` proof and does not carry a challenge. If you
need replay protection, keep the window short and treat each presentation as single-use.

## Next steps

- **[Creating a Verifiable Presentation](./create.md)** — bundle and sign credentials, with the
  library or the CLI.
- **[Verifying a Verifiable Presentation](./verify.md)** — what each verification fragment covers
  and how to read a failure, with the library, the CLI, or the web verifier.

Presentations can be **created** with the library or the CLI, and **verified** with either of those
or by dropping the file onto the verifier at [trustvc.io](https://trustvc.io). All three run the
same checks and return the same fragments; they differ only in how the result is presented.
