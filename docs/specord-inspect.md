# `specord inspect`

`specord inspect` is the V1 extractor command. It produces internal JSON for review and testing, not OpenAPI output.

## Canonical command

```bash
specord inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

## Required behavior

- Load TypeScript program from `--project`
- Walk source under `--root`
- Extract operations, schemas, and diagnostics
- Emit deterministic JSON ordering
- Emit unresolved diagnostics instead of guessing when confidence is low

## Output

The output is an `InspectionModel` JSON document (see `spec/specord-v1-extractor-spec.md` for the normative contract).

At minimum, output includes:

- `source` metadata (`project`, `root`, `inspectedAt`, `version`)
- `operations`
- `schemas`
- `diagnostics`

## Exit behavior (recommended v1 policy)

- Successful extraction with warnings: exit 0
- Structural extraction failure: non-zero exit
- CI strictness is controlled by config `ci` flags

## Diagnostics

The command must use canonical diagnostic codes documented in the V1 spec. New diagnostic codes should be added to the spec before shipping.
