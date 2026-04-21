---
sidebar_position: 1
title: Getting Started
---

# Getting Started with TrustVC SDK

## Introduction

TrustVC (`@trustvc/trustvc`) is a comprehensive library for signing, verifying, and managing W3C Verifiable Credentials and OpenAttestation Verifiable Documents. It provides a unified API for credential issuance, selective disclosure, and multi-format verification.

## Prerequisites

- **Node.js** >= 20.0.0
- **npm** or **yarn**

## Installation

```bash
npm install @trustvc/trustvc
```

## Key Concepts

### W3C Verifiable Credentials

Verifiable Credentials (VCs) are a W3C standard for expressing tamper-evident claims about a subject. TrustVC implements the VC Data Model v2.0, enabling you to issue, hold, and verify credentials in a standardized, interoperable format.

### Cryptographic Suites

TrustVC supports two cryptographic suites for signing credentials. The default is **ecdsa-sd-2023** (using P-256 elliptic curve keys), which provides selective disclosure through mandatory pointers. The alternative is **bbs-2023** (using BLS12-381 keys), which also supports selective disclosure. Both produce `DataIntegrityProof` signatures.

### DID (Decentralized Identifier)

A Decentralized Identifier (DID) is a globally unique identifier that does not require a centralized registration authority. In TrustVC, the issuer of a credential is identified by a DID (e.g., `did:web:example.com:issuer:1`), and the signing key is resolved from the DID document.

### Selective Disclosure

Selective disclosure allows a credential holder to reveal only specific fields from a signed credential to a verifier, keeping the rest hidden. This is achieved by deriving a new credential from the original signed credential using JSON pointer paths to select which fields to disclose.

## Quick Start: Sign and Verify

This example walks through the full lifecycle: creating a raw credential, signing it, and verifying the result.

```ts
import { signW3C, verifyDocument, VerificationType } from '@trustvc/trustvc';

// 1. Define the raw credential
const credential = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/vc/status-list/2021/v1',
  ],
  type: ['VerifiableCredential'],
  issuer: 'did:web:example.com:issuer:1',
  validFrom: '2024-01-01T00:00:00Z',
  validUntil: '2029-12-31T23:59:59Z',
  credentialSubject: {
    type: ['Person'],
    givenName: 'John',
    birthDate: '1990-01-01T00:00:00Z',
  },
};

// 2. Define the signing key pair
const keyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  id: 'did:web:example.com:issuer:1#multikey-1',
  type: VerificationType.Multikey,
  controller: 'did:web:example.com:issuer:1',
  publicKeyMultibase: '<your-public-key-multibase>',
  secretKeyMultibase: '<your-secret-key-multibase>',
};

// 3. Sign the credential (defaults to ecdsa-sd-2023)
const signedCredential = await signW3C(credential, keyPair);
console.log('Signed credential:', signedCredential);

// 4. Verify the signed credential
const fragments = await verifyDocument(signedCredential);

// 5. Check the result
const allValid = fragments.every((f) => f.status === 'VALID' || f.status === 'SKIPPED');
console.log('Verification passed:', allValid);
```

## Using the DocumentBuilder

The `DocumentBuilder` provides a fluent API for constructing, signing, deriving, and verifying credentials in a single chain.

```ts
import { DocumentBuilder } from '@trustvc/trustvc';

// 1. Build and sign a credential
const builder = new DocumentBuilder()
  .credentialSubject({
    type: ['Person'],
    givenName: 'Alice',
    familyName: 'Smith',
    birthDate: '1985-06-15T00:00:00Z',
  })
  .credentialStatus({
    id: 'https://example.com/credentials/statuslist/1#0',
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: '0',
    statusListCredential: 'https://example.com/credentials/statuslist/1',
  });

// 2. Sign the credential
const signedDoc = await builder.sign(keyPair);
console.log('Signed:', signedDoc);

// 3. Derive with selective disclosure (reveal only givenName)
const derivedDoc = await builder.derive({
  selectivePointers: ['/credentialSubject/givenName'],
});
console.log('Derived:', derivedDoc);

// 4. Verify the derived credential
const verificationResult = await builder.verify();
console.log('Valid:', verificationResult);
```

## Selective Disclosure

After signing a credential with `ecdsa-sd-2023` or `bbs-2023`, you can derive a new credential that reveals only selected fields using JSON pointer paths.

```ts
import { deriveW3C } from '@trustvc/trustvc';

const derivedCredential = await deriveW3C(signedCredential, {
  selectivePointers: ['/type', '/credentialSubject/givenName'],
});

// The derived credential reveals only `type` and `givenName`.
// All other fields (e.g., `birthDate`) are hidden from the verifier.
```

The derived credential is independently verifiable -- the verifier does not need access to the original signed credential.

## Core Functions Reference

| Function | Description |
|---|---|
| `signW3C` | Sign a W3C Verifiable Credential (`ecdsa-sd-2023` or `bbs-2023`) |
| `signOA` | Sign an OpenAttestation document (v2 or v3) |
| `deriveW3C` | Derive a credential with selective disclosure from a signed W3C VC |
| `verifyDocument` | Verify any signed document (W3C VC, OA VD, or OpenCert) |
| `wrapOADocument` | Wrap a single OpenAttestation document |
| `encrypt` / `decrypt` | Encrypt and decrypt data using ChaCha20 |
| `DocumentBuilder` | Fluent API for building, signing, deriving, and verifying credentials |

## Supported Networks

TrustVC supports on-chain verification across the following networks:

### Mainnets

| Network | Code | Chain ID |
|---|---|---|
| Ethereum | ETH | 1 |
| Polygon | MATIC | 137 |
| XDC | XDC | 50 |
| Stability | FREE | 101010 |
| Astron | ASTRON | 1338 |

### Testnets

| Network | Code | Chain ID |
|---|---|---|
| Sepolia (Ethereum) | ETH | 11155111 |
| Amoy (Polygon) | MATIC | 80002 |
| XDC Apothem | XDC | 51 |
| Stability Testnet | FREE | 20180427 |
| Astron Testnet | ASTRON | 21002 |

## What's Next

- [**Tutorial: Creator**](/docs/tutorial/creator) -- Build a full document issuance backend
- [**How-To: Create a W3C Document**](/docs/how-tos/create-w3c-document) -- Step-by-step W3C credential creation
- [**How-To: Verify a Document**](/docs/how-tos/verifydocument) -- Verification details and fragment handling
- [**Migration Guide**](/docs/migration-guide/trustvc) -- Migrating from OpenAttestation to TrustVC
