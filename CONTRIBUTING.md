# Contributing to Specord

Thanks for contributing.

## Before you start

- Read `spec/specord-v1-extractor-spec.md`.
- Confirm the change aligns with extractor-first scope.
- For major behavior/design changes, open an RFC issue first.

## Contribution flow

1. Create a focused branch.
2. Implement changes with fixture-driven validation.
3. Run `specord inspect` against `examples/nestjs-api`.
4. Ensure output remains deterministic and diagnostics are intentional.
5. Open a PR with:
   - motivation,
   - behavior changes,
   - test/snapshot evidence,
   - spec updates (if any contract changed).

## RFC requirement

Use the RFC issue template for:

- Internal model contract changes
- Diagnostic taxonomy changes
- Config schema or precedence changes
- Cross-cutting architectural decisions

## Quality bar

- No speculative inference for unresolved cases.
- Diagnostic codes must be consistent and documented.
- Contract changes must update both implementation and docs in the same PR.
