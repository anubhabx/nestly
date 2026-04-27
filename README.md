# Specord

Annotation-light OpenAPI documentation tooling for NestJS, starting with a source-first extractor.

## Current Status

Specord is in the extractor-first phase. The active target is a deterministic `specord inspect` workflow against `examples/nestjs-api`.

- Primary spec: `spec/specord-v1-extractor-spec.md`
- Focus: route/DTO/diagnostic extraction from TypeScript source
- Deferred: OpenAPI emission polish and UI renderer

## Quickstart

1. Install dependencies for the repo.
2. Run the inspect command against the fixture project:

```bash
specord inspect --project examples/nestjs-api/tsconfig.json --root examples/nestjs-api/src
```

3. Confirm stable JSON output and diagnostics align with the V1 extractor spec.

## Documentation Map

- [`spec/specord-v1-extractor-spec.md`](spec/specord-v1-extractor-spec.md): normative V1 extractor contract
- [`docs/getting-started.md`](docs/getting-started.md): setup and first run workflow
- [`docs/specord-inspect.md`](docs/specord-inspect.md): command behavior and output contract pointers
- [`docs/configuration.md`](docs/configuration.md): minimum `specord.config.ts` shape and precedence
- [`docs/development.md`](docs/development.md): local development and test/snapshot flow
- [`CONTRIBUTING.md`](CONTRIBUTING.md): contribution process and RFC usage

## Guiding Principles

- Source-first extraction is the trust boundary.
- Determinism beats speculative inference.
- Unresolved cases are acceptable when surfaced with precise diagnostics.

## Contributing

Before opening feature work, read `CONTRIBUTING.md` and use the RFC template for non-trivial design changes.
