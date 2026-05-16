# Phase 6 Session Report - API History Plan and Browser-Local Try It

**Phase:** 6 - API history architecture and first Try it execution slice
**Date:** 2026-05-16
**Status:** Plan added; browser-local Try it execution implemented and verified

---

## Status Summary

Phase 6 now has a repo-stored plan for release-indexed API history, background changelog indexing, and operation-level provenance. The implementation slice in this session enables the existing `@specord/ui` Try it panel to send browser-local requests for the selected operation.

Health is green:

- `@specord/ui`: 1 file, 8 tests passing.
- `@specord/cli`: 3 files, 10 tests passing.
- `@specord/nestjs`: 1 file, 5 tests passing.
- Workspace `pnpm.cmd build`: 6 Turborepo package builds successful.
- Workspace `pnpm.cmd test`: 11 Turborepo tasks successful.
- Generate smoke passed for `examples/nestjs-realworld`.
- Browser QA confirmed invalid JSON validation and real HTTP response rendering from the Try it panel.

---

## What Was Built

| Area | Delivered |
| --- | --- |
| Product plan | Added `spec/Phase-6-api-history-and-try-it-plan.md` |
| History architecture | Planned release-marker discovery, lazy snapshots, background indexing, and operation-scoped history queries |
| Performance target | Documented warm changelog targets: under 1s on stronger laptops and 2-3s on weaker laptops |
| Try it execution | Enabled browser-local request sending from the Try it panel |
| Request construction | Supports path parameters, query parameters, header parameters, and JSON request bodies |
| Response rendering | Shows HTTP status, elapsed time, content type, and formatted response body |
| Error handling | Shows missing required parameters, invalid JSON body input, and fetch/CORS/network failures |
| Credential boundary | Keeps values in-browser only; no credential persistence or server proxy |
| Docs refresh | Updated Nest, serve, and getting-started docs to describe local Try it behavior |
| Tests | Added static UI contract coverage for Try it execution hooks |

---

## Acceptance Matrix

| Criterion | Status | Evidence |
| --- | --- | --- |
| Phase 6 plan exists in repo | Pass | `spec/Phase-6-api-history-and-try-it-plan.md` |
| Changelog/indexing plan separates warm reads from cold builds | Pass | Plan covers prepared index reads, lazy snapshots, cache keys, and background backfill |
| Try it no longer presents as pending-only | Pass | Static UI test rejects `Execution contract pending` |
| Try it exposes send and response hooks | Pass | `data-specord-try-submit`, `data-specord-try-result` test assertions |
| Try it validates JSON before sending | Pass | Browser QA showed `Request body must be valid JSON.` |
| Try it sends a real browser request | Pass | Browser QA POSTed `/orders` and rendered `405 Method Not Allowed` from the docs server |
| Shared renderer remains compatible with standalone serving | Pass | `@specord/cli` tests and browser serve check |
| Shared renderer remains compatible with Nest injection | Pass | `@specord/nestjs` tests |
| Workspace build remains green | Pass | `pnpm.cmd build` |
| Workspace tests remain green | Pass | `pnpm.cmd test` |

---

## Extraction Output Summary

Generate smoke target:

| Fixture | OpenAPI | Paths | Operations | Schemas | Warnings |
| --- | --- | ---: | ---: | ---: | ---: |
| `examples/nestjs-realworld` | 3.1.0 | 5 | 6 | 6 | 2 unresolved warnings |

Try it behavior summary:

| Surface | Result |
| --- | --- |
| Required params | Missing required path/query/header values are blocked before fetch |
| Request body | Empty body defaults to `{}`; invalid JSON is blocked before fetch |
| Request target | Uses OpenAPI `servers[0].url`, configured `appUrl`, or same-origin fallback |
| Response | Renders status, elapsed time, content type, JSON pretty-printing, and text fallback |
| Credential handling | No persisted auth or proxy behavior |

---

## Architecture Capabilities

The system can now:

- Plan API history around release markers such as Git tags, GitHub Releases, package version bumps, or custom release commands.
- Treat release snapshots as lazy, cached OpenAPI artifacts keyed by commit/config/tool inputs.
- Keep changelog UI reads operation-scoped instead of loading global history.
- Render partial indexing states while cold history backfill continues.
- Send local Try it requests directly from the browser.
- Display useful request failures without server-side proxy infrastructure.

The system still cannot:

- Build the API history index.
- Persist or share history snapshots across machines.
- Fetch GitHub Release metadata.
- Diff OpenAPI snapshots into changelog records.
- Store auth credentials or environments.
- Bypass CORS for standalone docs served separately from the app.

---

## Codebase Metrics

| Metric | Value |
| --- | ---: |
| Branch | `develop` |
| Local branch state | Ahead of `origin/develop` by 9 commits before this uncommitted checkpoint |
| Files changed in this slice | 7 tracked files |
| Workspace files under packages/examples/spec/docs/reports, excluding dist/node_modules | 191 |
| TypeScript source lines under packages, excluding dist/node_modules | 8,738 |
| New runtime dependencies | 0 |
| New public package APIs | 0 |

---

## Decision Log

| Decision | Rationale |
| --- | --- |
| Store history architecture in `spec/` | Phase 6 changes the product contract and future package boundaries |
| Make changelog reads index-first | The user benchmark target is warm changelog load time, not cold historical computation |
| Keep cold history work backgrounded | Full Git/OpenAPI backfills can exceed UI latency budgets |
| Use release markers as snapshot anchors | Tags, GitHub Releases, and package version bumps match real deployment/version workflows |
| Implement Try it as browser-local first | It gives immediate value without proxy/auth/storage architecture decisions |
| Do not store credentials | Keeps the first execution slice safe and local |
| Preserve CORS behavior | Browser security remains visible instead of hidden behind a premature proxy |
| Keep renderer dependency-free | Preserves the current package/release shape |

---

## Roadmap

| Phase | Focus | TODO |
| --- | --- | --- |
| Phase 6a | History config | Add config types for `release.source`, tag patterns, package version files, and snapshot mode |
| Phase 6b | Snapshot cache | Implement commit/config/tool keyed OpenAPI snapshot cache under `.git/specord` |
| Phase 6c | Diff engine | Convert release-to-release OpenAPI diffs into operation-scoped history records |
| Phase 6d | History server routes | Add local docs server endpoints for operation history, job status, and commit drilldown |
| Phase 6e | UI changelog | Render indexed operation changelog with progressive background updates |
| Phase 6f | Try it hardening | Add generated request examples, auth helper inputs, request history, and optional proxy only after the security contract is explicit |

---

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Browser-local Try it may fail due to CORS | Medium | UI surfaces fetch failure; future proxy requires explicit security design |
| Users may expect credential persistence | Medium | Copy states that values stay in tab and Specord does not store credentials |
| Invalid JSON is the only body validation today | Low | Future examples/schema validation can improve before send |
| Large history backfill can be expensive | Medium | Plan makes warm reads index-first and cold builds background/resumable |
| Release markers can be noisy in active repos | Medium | Plan supports tag patterns, lazy snapshots, and no-API-change skipping |
| Inline client script continues to grow | Medium | Keep contract tests and consider extracting tested helpers when Phase 6 history work expands |

---

## Verification

Commands run:

```bash
pnpm.cmd --filter @specord/ui test
pnpm.cmd --filter @specord/ui build
pnpm.cmd --filter @specord/cli test
pnpm.cmd --filter @specord/nestjs test
pnpm.cmd --silent generate -- examples/nestjs-realworld --pretty
pnpm.cmd build
pnpm.cmd test
pnpm.cmd serve -- examples/nestjs-realworld --port 4797 --pretty
Invoke-WebRequest http://127.0.0.1:4797/health
```

Results:

- `@specord/ui` test exited 0 with 8 passing tests.
- `@specord/ui` build exited 0.
- `@specord/cli` test exited 0 with 10 passing tests.
- `@specord/nestjs` test exited 0 with 5 passing tests.
- Workspace build exited 0 with 6 successful Turborepo tasks.
- Workspace test exited 0 with 11 successful Turborepo tasks.
- `examples/nestjs-realworld` generate emitted 5 paths, 6 operations, 6 schemas, and 2 unresolved warnings.

Browser QA:

- Opened `http://127.0.0.1:4797/api`.
- Selected `POST /orders`.
- Confirmed Try it panel shows body input, send action, and response area.
- Entered invalid JSON and confirmed client-side validation.
- Sent `{}` and confirmed a real `405 Method Not Allowed` response from the docs server rendered in the panel.
- The browser console logged the expected failed resource entry for the deliberate `POST /orders` against the docs server.
- Stopped the temporary docs server after verification.
