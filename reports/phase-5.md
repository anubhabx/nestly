# Phase 5 Session Report - Read-Only Docs UI Upgrade

**Phase:** 5 - Rich local API documentation browser
**Date:** 2026-05-15
**Status:** UI upgrade implemented and locally verified; publish remains gated

---

## Status Summary

Phase 5 starts the API/UI depth roadmap without changing the release gate. The actual npm publish remains pending explicit approval. This slice upgrades the `@specord/ui` docs scaffold into a richer read-only OpenAPI workbench shared by both `specord serve` and `setupSpecordDocs(app)`.

The UI is still dependency-free and does not execute API requests. It focuses on developer reading workflows: searching routes, filtering by method, inspecting operation details, browsing schemas, copying the OpenAPI JSON, and preserving responsive readability.

Health after the implementation pass:

- `@specord/ui`: 1 file, 3 tests passing.
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
| UI architecture | Replaced the basic endpoint list with a three-panel docs workbench |
| Visual design | Added premium navigation, wide title treatment, ambient background, summary metrics, glass panels, compact method chips, and responsive layout |
| Operations | Added route search, method filtering, tag grouping, selected-operation state, and deterministic visible-order selection |
| Operation detail | Added parameter, request-body, response, security, and raw operation panels |
| Schema explorer | Added schema list, property counts, selected schema detail, and JSON preview |
| Utility action | Added copy-JSON affordance with status toast |
| States | Added loading, error, empty, focus, hover, active, and reduced-motion handling |
| Safety | Preserved HTML escaping and safe injected client config serialization |
| Tests | Added coverage for the richer shell affordances and script-safe OpenAPI URL injection |

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Existing docs shell still renders escaped title/source data | Pass | `packages/ui/test/render-docs-ui.test.ts` |
| Shell exposes richer browser affordances | Pass | Test asserts search, filters, grouped operations, detail panel, schema list, copy JSON, loading, and error markers |
| Injected OpenAPI URL remains script-safe | Pass | Test covers `<script>` encoded to `\u003cscript>` in client config |
| `specord serve` still renders docs and JSON | Pass | `@specord/cli` serve test and local HTTP check |
| `setupSpecordDocs(app)` remains compatible | Pass | `@specord/nestjs` route-injection tests |
| Desktop docs UI loads generated OpenAPI | Pass | Browser showed OpenAPI `0.1.0`, 5 paths, 6 operations, 6 schemas |
| Search filters operations | Pass | Browser search for `download` reduced the list to one operation |
| Method filters operations and updates detail | Pass | Browser POST filter showed one operation and detail changed to `POST /orders` |
| Schema selection updates schema detail | Pass | Browser selection changed detail from `AddressDto` to `CreateOrderDto` |
| Mobile layout remains readable | Pass | Browser mobile screenshots caught and verified fixes for operation rows and raw-code contrast |
| Request execution remains absent | Pass | UI is read-only and labels requests as disabled |

---

## Extraction Output Summary

Browser QA target:

| Fixture | OpenAPI | Paths | Operations | Schemas | Warnings |
| --- | --- | ---: | ---: | ---: | ---: |
| `examples/nestjs-realworld` served at `/api/openapi.json` | 0.1.0 document version | 5 | 6 | 6 | 2 unresolved warnings logged server-side |

UI behavior summary:

| Surface | Result |
| --- | --- |
| Route index | Groups operations by tag and supports search/method filtering |
| Operation detail | Shows selected method/path plus parameters, security, body, responses, and raw operation JSON |
| Schema explorer | Lists all component schemas and displays selected schema JSON |
| Summary metrics | Shows OpenAPI version, paths, operations, and schemas |
| Copy JSON | Provides a clipboard action with fallback status messaging |

---

## Architecture Capabilities

The docs UI can now:

- Render a useful local API reference without third-party UI/runtime dependencies.
- Consume any OpenAPI document served by the existing Specord JSON route.
- Let users search and filter operations without a build step.
- Keep operation details and schema details on the same page.
- Preserve a single renderer shared by CLI serving and Nest route injection.
- Stay read-only, avoiding auth/request-execution decisions.

The docs UI still cannot:

- Execute API requests.
- Persist user preferences between refreshes.
- Deep-link to a specific operation or schema.
- Render a full Swagger/Scalar-level API reference.
- Provide advanced schema visualization beyond JSON preview.

---

## Codebase Metrics

| Metric | Value |
| --- | ---: |
| Branch | `develop` |
| Commits before this UI checkpoint | 45 |
| Files changed in this slice | 2 tracked files |
| Workspace files under packages/examples/spec/docs/reports, excluding dist/node_modules | 186 |
| TypeScript source lines under packages, excluding declarations and dist | 22,787 |
| New runtime dependencies | 0 |
| Publish status | Not run |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Keep the UI dependency-free | Protects the publishable package shape prepared in Phase 4 |
| Keep request execution out of scope | Try-it-out behavior needs auth, environment, and safety decisions |
| Use the shared `@specord/ui` renderer | One implementation improves both `specord serve` and Nest route injection |
| Prefer operation/schema browsing over marketing layout | The docs route is an operational developer tool, not a landing page |
| Preserve `/api` and `/api/openapi.json` behavior | Phase 3 route-injection contract remains stable |
| Use deterministic visible order for selection | The detail pane should match the first visible operation after sorting/filtering |

---

## Roadmap

| Phase | Focus | TODO |
| --- | --- | --- |
| Phase 5 follow-up | Deep links | Add URL hash support for operation/schema selection |
| Phase 5 follow-up | Schema UX | Render schema properties as structured rows before the raw JSON preview |
| Phase 5 follow-up | Diagnostics | Surface unresolved warnings in the UI when the JSON route can expose them |
| Phase 5 follow-up | Theme polish | Add optional compact mode for dense APIs |
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
| Visual polish could drift into marketing UI | Low | Current layout remains a developer workbench with dense scanning surfaces |

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
- Confirmed page identity, title, route index, operation detail, schema explorer, and summary metrics.
- Confirmed search for `download` reduced operations to one matching route.
- Confirmed POST method filtering selected `POST /orders` and displayed required JSON request body.
- Confirmed schema selection updated the detail panel to `CreateOrderDto`.
- Confirmed console warnings/errors were empty in the Playwright browser.
- Captured desktop and mobile screenshots, then moved screenshots out of the repository workspace.
- Stopped stale local docs-server processes between UI rebuilds so browser checks used current compiled UI.
