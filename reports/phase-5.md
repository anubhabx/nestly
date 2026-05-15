# Phase 5 Session Report - Read-Only Docs UI Upgrade

**Phase:** 5 - Minimal local API documentation devtool
**Date:** 2026-05-15
**Status:** UI upgrade implemented and locally verified; publish remains gated

---

## Status Summary

Phase 5 starts the API/UI depth roadmap without changing the release gate. The actual npm publish remains pending explicit approval. This slice upgrades the `@specord/ui` docs scaffold into a minimal read-only OpenAPI devtool shared by both `specord serve` and `setupSpecordDocs(app)`.

The UI is still dependency-free and does not execute API requests. The corrected design deliberately removes the earlier decorative workbench treatment: no hero, no KPI cards, no fake runtime status panel, no dashboard framing. Users land directly on the operation list and selected contract detail.

Health after the implementation pass:

- `@specord/ui`: 1 file, 4 tests passing.
- `@specord/cli`: 3 files, 10 tests passing.
- `@specord/nestjs`: 1 file, 5 tests passing.
- Workspace `pnpm.cmd test`: 11 Turborepo tasks successful.
- Workspace `pnpm.cmd build`: 6 Turborepo tasks successful.
- Dependency audit passed with 0 production and 0 total advisories.
- Generate smoke passed for both canonical fixtures.
- Browser QA covered desktop and mobile render states against `examples/nestjs-realworld`.
- No new runtime dependencies were added.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| UI architecture | Replaced the decorative workbench with a flat operation-first devtool |
| Visual design | Removed hero, KPI cards, ambient background, glass panels, and decorative runtime chrome |
| Operations | Added route search, method filtering, flat operation list, selected-operation state, and deterministic visible-order selection |
| Operation detail | Added parameter, request-body, response, security, and raw operation panels |
| Schema explorer | Kept schemas as supporting reference, secondary to the operation workflow |
| Utility action | Added copy-JSON affordance with status toast |
| States | Added loading, error, empty, focus, hover, and active handling |
| Safety | Preserved HTML escaping and safe injected client config serialization |
| Tests | Added coverage for minimal shell affordances, no-KPI/no-hero constraints, and script-safe OpenAPI URL injection |

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Existing docs shell still renders escaped title/source data | Pass | `packages/ui/test/render-docs-ui.test.ts` |
| Shell exposes operation-first devtool affordances | Pass | Test asserts search, filters, operation list, detail panel, schema list, copy JSON, loading, and error markers |
| Dashboard KPIs and decorative hero chrome are absent | Pass | Test rejects `path-count`, `operation-count`, `schema-count`, `console-card`, `inline-lens`, and `summary-grid` |
| Injected OpenAPI URL remains script-safe | Pass | Test covers `<script>` encoded to `\u003cscript>` in client config |
| `specord serve` still renders docs and JSON | Pass | `@specord/cli` serve test and local HTTP check |
| `setupSpecordDocs(app)` remains compatible | Pass | `@specord/nestjs` route-injection tests |
| Desktop docs UI loads generated OpenAPI | Pass | Browser showed immediate operations list and selected `GET /orders` detail |
| Search filters operations | Pass | Browser search for `download` reduced the list to one operation |
| Method filters operations and updates detail | Pass | Browser POST filter showed one operation and detail changed to `POST /orders` |
| Mobile layout remains readable | Pass | Browser mobile screenshot showed toolbar, search, filters, operations, and selected detail without KPI/dashboard chrome |
| Request execution remains absent | Pass | UI is read-only and exposes JSON/copy only |

---

## Extraction Output Summary

Browser QA target:

| Fixture | OpenAPI | Paths | Operations | Schemas | Warnings |
| --- | --- | ---: | ---: | ---: | ---: |
| `examples/nestjs-realworld` served at `/api/openapi.json` | 0.1.0 document version | 5 | 6 | 6 | 2 unresolved warnings logged server-side |

UI behavior summary:

| Surface | Result |
| --- | --- |
| Route index | Shows operations immediately and supports search/method filtering |
| Operation detail | Shows selected method/path plus parameters, security, body, responses, and raw operation JSON |
| Schema explorer | Lists component schemas as secondary reference when viewport width allows |
| Copy JSON | Provides a clipboard action with fallback status messaging |

---

## Architecture Capabilities

The docs UI can now:

- Render a useful local API reference without third-party UI/runtime dependencies.
- Consume any OpenAPI document served by the existing Specord JSON route.
- Let users search and filter operations without a build step.
- Keep operation details on the same page as the route index.
- Keep schema browsing available as supporting reference on wider viewports.
- Preserve a single renderer shared by CLI serving and Nest route injection.
- Stay read-only, avoiding auth/request-execution decisions.

The docs UI still cannot:

- Execute API requests.
- Persist user preferences between refreshes.
- Deep-link to a specific operation or schema.
- Render a full Swagger/Scalar-level API reference.
- Provide advanced schema visualization beyond JSON preview.
- Keep schema browsing visible on narrow viewports.

---

## Codebase Metrics

| Metric | Value |
| --- | ---: |
| Branch | `develop` |
| Commits before this UI checkpoint | 45 |
| Files changed in this slice | 2 tracked files |
| Workspace files under packages/examples/spec/docs/reports, excluding dist/node_modules | 186 |
| TypeScript source lines under packages, excluding declarations and dist | 21,608 |
| New runtime dependencies | 0 |
| Publish status | Not run |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Keep the UI dependency-free | Protects the publishable package shape prepared in Phase 4 |
| Keep request execution out of scope | Try-it-out behavior needs auth, environment, and safety decisions |
| Use the shared `@specord/ui` renderer | One implementation improves both `specord serve` and Nest route injection |
| Prefer operation-first browsing over dashboard layout | The docs route is a developer tool, not an analytics surface |
| Remove KPI-style cards | Path/operation/schema counts do not help the user get to a route faster |
| Remove decorative hero/runtime chrome | The first viewport should be usable, not explanatory |
| Preserve `/api` and `/api/openapi.json` behavior | Phase 3 route-injection contract remains stable |
| Use deterministic visible order for selection | The detail pane should match the first visible operation after sorting/filtering |

---

## Roadmap

| Phase | Focus | TODO |
| --- | --- | --- |
| Phase 5 follow-up | Deep links | Add URL hash support for operation/schema selection |
| Phase 5 follow-up | Schema UX | Render schema properties as structured rows before the raw JSON preview |
| Phase 5 follow-up | Diagnostics | Surface unresolved warnings in the UI when the JSON route can expose them |
| Phase 5 follow-up | Mobile schemas | Add a precise schema access pattern for narrow screens without crowding the operation workflow |
| Phase 5 decision | Request execution | Decide whether try-it-out belongs in V1 and what auth/storage rules apply |
| Phase 4 release gate | First npm publish | Run only after explicit approval |

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Larger inline renderer can become hard to maintain | Medium | Keep tests on shell contracts and consider extracting client helpers if the UI grows again |
| JSON previews are useful but not as readable as structured schema tables | Medium | Roadmap includes structured schema rendering |
| Clipboard API may be blocked in some browser contexts | Low | Toast reports clipboard denial or unavailability |
| Very large OpenAPI documents may make client-side filtering heavy | Medium | Current V1 fixtures are small; add virtualized or paged lists if real-project docs need it |
| Visual polish could drift into marketing UI | Medium | Tests now reject the dashboard KPI and hero chrome patterns |

---

## Verification

Commands and checks run during the implementation pass:

```bash
pnpm.cmd --filter @specord/ui test
pnpm.cmd --filter @specord/ui build
pnpm.cmd --filter @specord/cli test
pnpm.cmd --filter @specord/nestjs test
pnpm.cmd test
pnpm.cmd build
pnpm.cmd audit --prod --json
pnpm.cmd audit --json
pnpm.cmd --silent generate -- examples/nestjs-realworld --pretty
pnpm.cmd --silent generate -- examples/nestjs-api --pretty
pnpm.cmd serve -- examples/nestjs-realworld --port 4795 --pretty
Invoke-WebRequest http://127.0.0.1:4795/api/openapi.json
```

Results:

- Workspace tests exited 0 with 11 successful Turborepo tasks.
- Workspace build exited 0 with 6 successful Turborepo tasks.
- Production audit and full audit both reported 0 vulnerabilities.
- `examples/nestjs-realworld` generate emitted 5 paths, 6 operations, 6 schemas, and 2 unresolved warnings.
- `examples/nestjs-api` generate emitted 9 paths, 15 operations, 8 schemas, and 25 unresolved warnings.
- Both generator smokes exited 0.

Browser QA:

- Opened `http://127.0.0.1:4795/api`.
- Confirmed page identity, title, route index, and selected operation detail.
- Confirmed search for `download` reduced operations to one matching route.
- Confirmed POST method filtering selected `POST /orders` and displayed required JSON request body.
- Confirmed console warnings/errors were empty in the Playwright browser.
- Captured desktop and mobile screenshots.
- Stopped stale local docs-server processes between UI rebuilds so browser checks used current compiled UI.
