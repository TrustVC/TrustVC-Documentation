---
id: w3c-vc-support
title: Decentralized Renderer - W3C VC Support
sidebar_label: Decentralized Renderer Migration
---

This guide helps you migrate a **decentralized renderer** so it supports **W3C Verifiable Credentials (VC)** alongside existing **OpenAttestation (OA)** documents.

## Why this matters

- **Future-proof document support:** One codebase handles OA and W3C VC.
- **Simpler component code:** Shared types and a single payload path reduce branching.
- **Consistent validation:** Canonical detection and known `@context` URLs avoid drift.

---

## 1) Update dependencies

### 1.1 Core packages

Use **published** packages from npm (avoid `file:` or other local path dependencies).

Install the latest renderer components and TrustVC core:

```bash
npm install @trustvc/decentralized-renderer-react-components@latest @trustvc/trustvc@latest
```

---

## 2) Type migration (OA + W3C)

### 2.1 Import canonical types from TrustVC

Define a single union type for documents your templates accept:

```typescript
import {
  OpenAttestationDocument,
  SignedVerifiableCredential,
} from "@trustvc/trustvc";

export type SupportedDocument = OpenAttestationDocument | SignedVerifiableCredential;
```

### 2.2 Add a payload extraction helper

Use **one helper** to read display data for both formats:

- **OA:** payload lives at the **root** of the document.
- **W3C VC:** payload lives under **`credentialSubject`** (which may be an object or an array per the data model).

```typescript
import {
  vc,
  SignedVerifiableCredential,
  OpenAttestationDocument,
} from "@trustvc/trustvc";

type SupportedDocument = OpenAttestationDocument | SignedVerifiableCredential;
type GenericPayload = Record<string, unknown>;

export function getPayload(doc: SupportedDocument): GenericPayload {
  if (vc.isSignedDocument(doc)) {
    // W3C VC — credentialSubject may be object or array
    const subject = (doc as SignedVerifiableCredential).credentialSubject;
    return Array.isArray(subject)
      ? Object.assign({}, ...subject)
      : (subject as GenericPayload);
  }
  // OA — use root document as payload
  return doc as unknown as GenericPayload;
}
```

## 3) W3C VC support (new documents)

### 3.1 Replace custom W3C checks

Use TrustVC’s canonical detection instead of ad hoc helpers:

```typescript
import { vc } from "@trustvc/trustvc";

const isW3CVC = vc.isSignedDocument(document);
```

Remove legacy custom W3C utility modules after switching, so you do not maintain **two** detection paths.

## 4) Verify both formats

After migration:

- Render at least **one OA** sample document end to end.
- Render at least **one W3C VC** sample document end to end.

## Result

Your decentralized renderer can serve **OA and W3C VC** from one codebase, with backward compatibility for existing OA documents and a clear path for new W3C VC issuers.
