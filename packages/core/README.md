# @specord/core

Core source-analysis pipeline for Specord.

This package creates the TypeScript program, discovers NestJS controllers and DTOs, extracts the internal inspection model, applies `specord.config.ts`, and serializes deterministic inspection output.

## Install

```bash
npm install @specord/core
```

## Usage

Most users should start with `@specord/cli`. Use `@specord/core` directly when building custom tooling around Specord's inspection model.

## API History Primitives

Phase 6 exposes low-level helpers for the local API-history pipeline:

- `writeOpenApiSnapshot` and `readOpenApiSnapshot` store generated OpenAPI documents under `.git/specord/cache/snapshots`.
- `createSnapshotCacheKey` and `hashSnapshotInput` keep snapshot keys tied to commit, config, Specord version, and lockfile inputs.
- `diffOpenApiSnapshots` converts two OpenAPI documents into operation-scoped history records for added, removed, changed, deprecated, and security-impacting operations.
