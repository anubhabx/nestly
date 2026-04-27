# Getting Started

This guide covers the first successful extractor run for Specord V1.

## Prerequisites

- Node.js LTS
- Package manager used by this repo (`npm`, `pnpm`, or `yarn`)
- A clean install of repository dependencies

## First Run

Run the extractor against the primary fixture:

```bash
specord inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

Expected result:

- A valid inspection JSON payload
- Stable ordering of operations/schemas/diagnostics
- Warnings for unresolved inference cases (for example unresolved response/security)

## Validate against spec

Use the normative requirements in `spec/specord-v1-extractor-spec.md`:

- Determinism rules
- Diagnostic catalog
- Fixture acceptance matrix

If output differs from expected behavior, treat it as an extractor bug or a spec gap and open an issue.
