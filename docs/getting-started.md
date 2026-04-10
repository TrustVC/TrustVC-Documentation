---
sidebar_position: 1
title: Getting Started
---

# Getting Started with TrustVC SDK

TrustVC (`@trustvc/trustvc`) is a comprehensive library for signing and verifying W3C Verifiable Credentials and OpenAttestation Verifiable Documents. This guide will help you install the SDK and perform your first signing and verification.

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** or **yarn**

## Installation

```bash
npm install @trustvc/trustvc
```

## Quick Start

### 1. Sign a W3C Verifiable Credential

Use `signW3C` to sign a W3C-compliant credential with the **ecdsa-sd-2023** cryptographic suite (default).

```ts
import { signW3C, VerificationType } from '@trustvc/trustvc';

const credential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/vc/status-list/2021/v1',
  ],
  credentialSubject: {
    type: ['Person'],
    givenName: 'John',
    birthDate: '1990-01-01T00:00:00Z',
  },
  issuer: 'did:web:example.com:issuer:1',
  type: ['VerifiableCredential'],
  validFrom: '2024-01-01T00:00:00Z',
  validUntil: '2029-12-31T23:59:59Z',
};

const keyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  id: 'did:web:example.com:issuer:1#multikey-1',
  type: VerificationType.Multikey,
  controller: 'did:web:example.com:issuer:1',
  publicKeyMultibase: '<your-public-key-multibase>',
  secretKeyMultibase: '<your-secret-key-multibase>',
};

const signedCredential = await signW3C(credential, keyPair);
console.log(signedCredential);
```

> The `signW3C` function defaults to the `ecdsa-sd-2023` cryptosuite. You can also use `bbs-2023` by passing it as the third argument.

### 2. Verify a Document

Use `verifyDocument` to verify any signed document — W3C VCs, OpenAttestation VDs, or OpenCerts.

```ts
import { verifyDocument } from '@trustvc/trustvc';

const result = await verifyDocument(signedCredential);

console.log(result);
// Returns an array of verification fragments:
// - DOCUMENT_INTEGRITY: Was the document tampered with?
// - DOCUMENT_STATUS: Is the document still valid (not revoked)?
// - ISSUER_IDENTITY: Is the issuer who they claim to be?
```

Each fragment has a `status` of `"VALID"`, `"INVALID"`, `"SKIPPED"`, or `"ERROR"`.

### 3. Derive a Credential (Selective Disclosure)

When using `ecdsa-sd-2023` or `bbs-2023`, you can derive a new credential that reveals only selected fields.

```ts
import { deriveW3C } from '@trustvc/trustvc';

const derivedCredential = await deriveW3C(signedCredential, {
  selectivePointers: ['/type', '/credentialSubject/givenName'],
});

// The derived credential only reveals `type` and `givenName`.
// `birthDate` is hidden.
```

> For `ecdsa-sd-2023` and `bbs-2023` signed documents, `verifyDocument` automatically handles derivation internally if the document has not been derived yet.

## Core Functions

| Function | Description |
|---|---|
| `signW3C` | Sign a W3C Verifiable Credential (supports `ecdsa-sd-2023`, `bbs-2023`) |
| `signOA` | Sign an OpenAttestation document (v2 or v3) |
| `deriveW3C` | Derive a credential with selective disclosure |
| `verifyDocument` | Verify any signed document (W3C VC, OA VD, OpenCert) |
| `wrapOADocument` | Wrap a single OpenAttestation document |
| `wrapOADocuments` | Wrap multiple OpenAttestation documents |
| `encrypt` / `decrypt` | Encrypt/decrypt data using ChaCha20 |

## Supported Cryptographic Suites

| Suite | Key Type | Selective Disclosure |
|---|---|---|
| `ecdsa-sd-2023` (default) | Multikey (P-256) | Yes — via `mandatoryPointers` |
| `bbs-2023` | Multikey (BLS12-381) | Yes — via `mandatoryPointers` |

> `BbsBlsSignature2020` is deprecated. Use `ecdsa-sd-2023` or `bbs-2023` instead.

## Signing with Mandatory Pointers

Mandatory pointers let you specify fields that must always be disclosed, even after selective disclosure derivation.

```ts
const signed = await signW3C(
  credential,
  keyPair,
  'ecdsa-sd-2023',
  {
    mandatoryPointers: ['/issuer', '/credentialSubject/type'],
  }
);
```

## What's Next?

- [**Tutorial: Creator**](/docs/tutorial/creator) — Build a full document issuance backend
- [**How-To: Create a W3C Document**](/docs/how-tos/create-w3c-document) — Step-by-step W3C credential creation
- [**How-To: Verify a Document**](/docs/how-tos/verifydocument) — Verification details and fragment handling
- [**Migration Guide**](/docs/migration-guide/trustvc) — Migrating from OpenAttestation to TrustVC
