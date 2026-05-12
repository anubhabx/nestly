# Phase 3 Session Report - Dev Docs Runtime

**Phase:** 3 - Developer documentation runtime
**Date:** 2026-05-13
**Status:** Route-injection slice complete and locally verified

---

## Status Summary

Phase 3 adds the first local documentation runtime surfaces on top of the Phase 2 generator. The primary integration is `setupSpecordDocs(app)` from `@specord/nestjs`, which injects Swagger-like routes into an existing Nest app. The standalone `specord serve` command remains as a companion dev helper.

Health is green:

- `@specord/ui`: 1 file, 1 test passing.
- `@specord/nestjs`: 1 file, 2 tests passing.
- `@specord/cli`: 3 files, 9 tests passing.
- Workspace `pnpm.cmd test`: 11 Turborepo tasks successful.
- Workspace `pnpm.cmd build`: 6 package builds successful.
- Browser check passed for `http://127.0.0.1:4789/api`.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| Product contract | `spec/Phase-3-dev-docs-runtime-spec.md` defines route injection and standalone serving |
| UI scaffold | New `@specord/ui` package renders a static docs shell with summary and operation list |
| Nest adapter | `@specord/nestjs` exports `setupSpecordDocs(app, options)` |
| Default routes | Docs UI at `/api`, OpenAPI JSON at `/api/openapi.json` |
| Route overrides | `path` and `jsonPath` options normalize custom mounts |
| Document source | Nest helper accepts a document/factory or lazily generates from static source analysis |
| CLI dev server | `specord serve` serves `/api`, `/api/openapi.json`, `/health`, and redirects `/` to `/api` |
| Connected process helper | `specord serve --app-command "pnpm start:dev"` can start a Nest dev process beside docs |
| Docs | README, getting started, development docs, `docs/specord-nestjs.md`, and `docs/specord-serve.md` updated |

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Nest docs injection defaults to `/api` | Pass | `packages/nestjs/test/setup-docs.test.ts` |
| Nest JSON route defaults to `/api/openapi.json` | Pass | `packages/nestjs/test/setup-docs.test.ts` |
| Nest mount paths are overridable | Pass | `path: "reference"`, `jsonPath: "reference/spec.json"` test |
| UI shell escapes user-visible title input | Pass | `packages/ui/test/render-docs-ui.test.ts` |
| Standalone server renders docs without starting Nest | Pass | `packages/cli/test/serve.test.ts` |
| Standalone server redirects `/` to `/api` | Pass | `packages/cli/test/serve.test.ts` |
| Standalone server can spawn an optional app command | Pass | `packages/cli/test/serve.test.ts` |
| Existing inspect/generate behavior remains green | Pass | Workspace tests and explicit generate smoke |
| Browser-visible docs shell loads data | Pass | Browser check showed `/orders`, `GET`, OpenAPI `3.1.0`, 5 paths |

---

## Extraction Output Summary

Explicit generate smoke results:

| Fixture | OpenAPI | Paths | Operations | Schemas | Warnings |
| --- | --- | ---: | ---: | ---: | --- |
| `examples/nestjs-api` | 3.1.0 | 9 | 15 | 8 | 25 unresolved warnings |
| `examples/nestjs-realworld` | 3.1.0 | 5 | 6 | 6 | 2 unresolved warnings |

Docs runtime browser check:

| URL | Result |
| --- | --- |
| `http://127.0.0.1:4789/api` | Rendered docs scaffold and loaded operations |
| `http://127.0.0.1:4789/api/openapi.json` | Returned OpenAPI `3.1.0` with 5 paths |

---

## Architecture Capabilities

The system can now:

- Inject docs routes into an existing Nest app during bootstrap.
- Keep `/api` as the default documentation route, matching the familiar Swagger setup shape.
- Serve OpenAPI JSON from the same static source pipeline used by `specord generate`.
- Use a prebuilt document or document factory when callers want full control.
- Run an independent docs server for local inspection without editing app bootstrap code.
- Optionally start a user-provided Nest dev process beside the standalone docs server.

The system still cannot:

- Provide a full API reference UI beyond the scaffold.
- Execute requests from the docs UI.
- Infer runtime Nest module state.
- Replace every behavior of `SwaggerModule.setup()`.
- Avoid needing source paths when the app runs from compiled output and source is not in the current working directory.

---

## Codebase Metrics

| Metric | Value |
| --- | --- |
| Branch | `codex/phase-2-real-world-v1` |
| Commits at verification | 39 |
| Workspace packages | 7 |
| Package TypeScript lines, excluding `dist` | 6,426 |
| Repo files under packages/examples/spec/docs/reports | 162 |
| Runtime dependency added | None external |
| New workspace package | `@specord/ui` |
| New public Nest adapter API | `setupSpecordDocs(app, options)` |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Make route injection primary | The requested developer workflow is Swagger-like bootstrap integration, not only a separate server |
| Default docs mount to `/api` | Matches the requested default and common Swagger examples |
| Default JSON to `/api/openapi.json` | Keeps JSON discoverable under the docs mount |
| Keep standalone `serve` | It is still useful for early local viewing and was already started |
| Keep generation static | Preserves the Phase 2 trust boundary and avoids runtime Swagger coupling |
| Add `@specord/ui` package | Keeps UI rendering reusable between Nest injection and CLI serving |
| Accept document/factory override | Lets users cache, prebuild, or customize the document without changing route plumbing |

---

## Roadmap

| Phase | Focus | TODO |
| --- | --- | --- |
| Phase 3 follow-up | UI reference | Replace the scaffold with a fuller docs browser or embed a chosen renderer |
| Phase 3 follow-up | Adapter coverage | Add a Fastify-shaped route handler test |
| Phase 3 follow-up | DX polish | Add clearer logs for lazy generation errors in injected JSON route |
| Phase 3 follow-up | Config ergonomics | Document compiled `dist/` bootstrap patterns more explicitly |
| Phase 4 | Packaging | Decide publishable package shape and install workflow |

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Adapter registration may differ across Nest HTTP adapters | Medium | Current structural adapter route is minimal; add Fastify fixture/test next |
| UI is intentionally scaffold-level | Low | Documented as scaffold, with richer reference UI deferred |
| Lazy generation during request can be slow on large projects | Medium | Document factory option allows cached/prebuilt documents |
| Source paths may not resolve from compiled app runtime | Medium | `project` and `root` options documented; add dist-focused examples next |
| `serve --app-command` can leave child processes on unusual shutdown paths | Low | Tests cover spawn parameters; manual browser run was stopped after verification |

---

## Verification

Commands run:

```bash
pnpm.cmd --filter @specord/ui test
pnpm.cmd --filter @specord/nestjs test
pnpm.cmd --filter @specord/cli test
pnpm.cmd build
pnpm.cmd test
pnpm.cmd --silent generate -- examples/nestjs-api --pretty
pnpm.cmd --silent generate -- examples/nestjs-realworld --pretty
pnpm.cmd serve -- examples/nestjs-realworld --port 4789 --pretty
```

Browser verification:

- Opened `http://127.0.0.1:4789/api`.
- Confirmed the docs shell rendered with the OpenAPI JSON link.
- Confirmed the operation list loaded from JSON and included `GET /orders`.
- Confirmed `http://127.0.0.1:4789/api/openapi.json` returned OpenAPI `3.1.0` with 5 paths.
- Stopped the temporary server after verification.
