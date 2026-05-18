# Snapshot Changelog

This changelog is maintained by the pipeline snapshot test. When the normalized inspection snapshot changes intentionally, update this file with the new baseline and reason.

## 2026-05-18 - Canonical NestJS Benchmark Baseline

| Snapshot | Hash | Controllers | Paths | Operations | Schemas | Diagnostics |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| core.pipeline.nestjs-api.inspection.v1 | `b0bfc171a97cf2c5275bace56e70b34b0fefb3bd0543e37526b0353621d0ea79` | 7 | 22 | 27 | 42 | 29 |

Reason: reset the weak Nest examples into the canonical production-shaped `examples/nestjs-api` benchmark and refreshed the normalized inspection snapshot.

Diagnostic mix:

| Code | Count |
| --- | ---: |
| `EXTRACTOR_UNRESOLVED_RESPONSE` | 1 |
| `EXTRACTOR_UNRESOLVED_SECURITY` | 1 |
| `EXTRACTOR_UNSUPPORTED_DECORATOR` | 27 |
