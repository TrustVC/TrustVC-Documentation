---
id: verifydocument
title: verifyDocument
sidebar_label: Verify Document
---

## Overview

The `verifyDocument` function is TrustVC's unified verification entry point. It accepts any signed document -- W3C Verifiable Credentials or OpenAttestation Verifiable Documents -- and returns an array of verification fragments describing the outcome.

Verification answers three questions about a document:

1. **Integrity** -- Has the document been tampered with since it was signed?
2. **Status** -- Is the credential still active (not revoked or suspended)?
3. **Identity** -- Is the issuer who they claim to be?

A document is considered valid only when all three checks pass.

## Basic Usage

```ts
import { verifyDocument } from '@trustvc/trustvc';

const fragments = await verifyDocument(signedCredential);

console.log(fragments);
// Array of verification fragments, one per check
```

The function automatically detects the document format (W3C VC or OpenAttestation) and applies the correct set of verifiers.

## Understanding Verification Fragments

`verifyDocument` returns an array of `VerificationFragment` objects. Each fragment corresponds to one of three verification checks:

### DOCUMENT_INTEGRITY

Validates that the document has not been modified after signing. For W3C VCs, this checks the `DataIntegrityProof` signature. For OpenAttestation documents, this verifies the Merkle root and document hash.

```ts
const integrityFragment = fragments.find((f) => f.type === 'DOCUMENT_INTEGRITY');
console.log(integrityFragment.status); // "VALID" | "INVALID" | "SKIPPED" | "ERROR"
```

### DOCUMENT_STATUS

Checks whether the credential has been revoked or suspended. For W3C VCs using `BitstringStatusListEntry`, this resolves the status list credential and checks the bit at the specified index. For OpenAttestation documents, this checks the on-chain document store or token registry.

```ts
const statusFragment = fragments.find((f) => f.type === 'DOCUMENT_STATUS');
console.log(statusFragment.status);
```

### ISSUER_IDENTITY

Verifies that the issuer's identity can be resolved and trusted. For W3C VCs, this resolves the issuer's DID document and confirms the signing key is listed. For OpenAttestation documents, this checks DNS-TXT records or DNS-DID identity proofs.

```ts
const identityFragment = fragments.find((f) => f.type === 'ISSUER_IDENTITY');
console.log(identityFragment.status);
```

## Fragment Statuses

Each fragment returns one of the following statuses:

| Status | Meaning |
|---|---|
| `VALID` | The check passed successfully. |
| `INVALID` | The check failed. The document did not satisfy this verification step. |
| `SKIPPED` | The check was not applicable to this document type or configuration. |
| `ERROR` | An unexpected error occurred during the check (e.g., network failure, unresolvable DID). |

## Checking Results

### Using the `isValid` Helper

TrustVC provides an `isValid` utility to evaluate the overall verification result:

```ts
import { verifyDocument, isValid } from '@trustvc/trustvc';

const fragments = await verifyDocument(signedCredential);
const valid = isValid(fragments);

console.log('Document is valid:', valid); // true or false
```

`isValid` returns `true` only when every fragment has a status of `VALID` or `SKIPPED`. Any `INVALID` or `ERROR` fragment causes it to return `false`.

### Iterating Fragments

For more granular inspection, iterate through the fragments directly:

```ts
const fragments = await verifyDocument(signedCredential);

for (const fragment of fragments) {
  console.log(`${fragment.type}: ${fragment.status}`);
  if (fragment.status === 'INVALID' || fragment.status === 'ERROR') {
    console.log('  Reason:', fragment.reason);
  }
}
```

## Passing Options

### rpcProviderUrl

For documents that require on-chain verification (e.g., OpenAttestation documents using document stores or token registries), pass an Ethereum-compatible JSON-RPC provider URL:

```ts
const fragments = await verifyDocument(signedDocument, {
  rpcProviderUrl: 'https://rpc.sepolia.org',
});
```

This is required when:
- The document uses an on-chain document store for issuance status
- The document uses a token registry for transferable records

For W3C VCs that use off-chain status lists (e.g., `BitstringStatusListEntry`), the RPC provider URL is not required.

## Common Verification Failures

| Failure | Fragment Affected | Status | Likely Cause | Fix |
|---|---|---|---|---|
| Expired credential | `DOCUMENT_STATUS` | `INVALID` | The `validUntil` date has passed. | Issue a new credential with an updated expiry date. |
| Revoked credential | `DOCUMENT_STATUS` | `INVALID` | The credential's status list bit has been set to revoked. | If revocation was unintentional, update the status list credential to unset the bit. |
| Tampered document | `DOCUMENT_INTEGRITY` | `INVALID` | A field in the document was modified after signing. | Re-sign the document from the original source data. Do not manually edit signed documents. |
| Unknown issuer | `ISSUER_IDENTITY` | `INVALID` | The issuer's DID could not be resolved, or the signing key is not in the DID document. | Verify the DID is published and accessible. Ensure the key ID in the proof matches a key in the DID document. |
| Network mismatch | `DOCUMENT_STATUS` | `ERROR` | The `rpcProviderUrl` points to a different network than where the document store is deployed. | Use an RPC URL that matches the network the document was issued on (e.g., Sepolia for testnet documents). |
| DID resolution failure | `ISSUER_IDENTITY` | `ERROR` | The DID endpoint is unreachable or returns an invalid document. | Check network connectivity. Verify the DID URL is correct and the hosting server is running. |
| Missing status list | `DOCUMENT_STATUS` | `ERROR` | The `statusListCredential` URL is unreachable or returns invalid data. | Ensure the status list credential is published and accessible at the URL specified in the credential. |
