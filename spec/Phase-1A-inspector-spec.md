# Specord Phase 1A Spec Sheet: Trusted Inspect Output

## Goal

Convert the current Phase 0 extractor implementation into a test-protected, repeatable, confidence-building foundation for OpenAPI generation.

Specord now has a real TypeScript monorepo on the `develop` branch with `@specord/types`, `@specord/core`, `@specord/cli`, `@specord/openapi`, and `@specord/nestjs`. The current working path is `specord inspect`, which produces the internal `InspectionModel`. Phase 1A should lock that behavior with formal tests before adding response/security/schema overrides or OpenAPI output.

This phase does not implement OpenAPI 3.1 generation. It protects the extractor contract first.

---

## Current Code-Aware Status

### Confirmed Working Areas

The codebase currently includes:

```txt
packages/
  core/
    src/
      config/
        define-config.ts
        defaults.ts
        loader.ts
      diagnostics/
        diagnostic-builder.ts
      extractors/
        controller-discovery.ts
        route-extractor.ts
        param-extractor.ts
        schema-extractor.ts
        response-extractor.ts
      output/
        serializer.ts
      program/
        create-program.ts
        source-discovery.ts
      index.ts
      pipeline.ts

  cli/
    src/
      commands/
        inspect.ts
        generate.ts
      index.ts

  types/
    src/
      config.ts
      diagnostics.ts
      inspection-model.ts
      index.ts

  openapi/
  nestjs/
```

### Current Functional Capabilities

The current pipeline can:

- create a TypeScript Program from `tsconfig.json`
- discover source files under `--root`
- identify controller files and DTO/entity files by suffix
- discover NestJS controllers
- extract route handlers from HTTP method decorators
- normalize NestJS paths into OpenAPI-style paths
- apply `routing.globalPrefix` during route extraction
- extract `@Param`, `@Query`, `@Body`, and `@Headers`
- infer primitive parameter types
- refine parameter types from known pipes like `ParseIntPipe`
- extract DTO/entity schemas
- detect mapped types such as `PartialType`
- emit diagnostics for unsupported mapped types
- infer response status codes from HTTP method defaults and `@HttpCode`
- emit diagnostics for unresolved response schemas
- detect guard-backed routes and emit unresolved security diagnostics
- detect unsupported route decorators
- detect duplicate route conflicts
- detect invalid path template params
- serialize output deterministically
- run `specord inspect` through the CLI
- keep `specord generate` as an intentional stub

### Current Non-Goals / Not Yet Implemented

The codebase does not yet fully support:

- OpenAPI 3.1 emission
- `specord generate`
- response override application
- security override application
- schema override application
- full `PartialType` property resolution
- full query DTO expansion into individual query parameters
- formal tests around the fixture
- CI enforcement

---

## Why Phase 1A Comes Next

The extractor now has enough real behavior that uncontrolled changes can break the product’s core promise.

The right move is to freeze the current behavior before expanding the surface area.

Without Phase 1A, the next phases become harder to debug:

```txt
bad OpenAPI output
  could be caused by extraction bugs
  could be caused by serializer drift
  could be caused by config override bugs
  could be caused by emitter bugs
```

With Phase 1A, the pipeline becomes safer:

```txt
stable inspected model
  -> override layer can be tested separately
  -> OpenAPI emitter can be tested separately
  -> docs renderer can be tested separately
```

Phase 1A is about creating trust in `specord inspect`.

---

## Scope

### In Scope

- Add formal Vitest tests for `@specord/core`
- Add a reusable fixture inspection harness
- Snapshot-test normalized `InspectionModel` output
- Add explicit acceptance tests for the NestJS fixture
- Test deterministic serializer behavior
- Test key diagnostics
- Test config resolution basics
- Test `routing.globalPrefix` behavior
- Add CI for build and test

### Out of Scope

- OpenAPI 3.1 generation
- `specord generate` implementation
- docs UI / renderer
- VS Code extension
- watch mode
- Express/Fastify adapters
- full config override application
- full mapped type resolution
- broad class-validator coverage beyond current behavior

---

## Primary Target Files

Phase 1A should mainly touch:

```txt
packages/core/src/pipeline.ts
packages/core/src/output/serializer.ts
packages/core/src/config/loader.ts
packages/core/src/extractors/schema-extractor.ts
packages/core/src/extractors/response-extractor.ts
packages/core/src/extractors/param-extractor.ts
packages/cli/src/commands/inspect.ts
packages/cli/src/commands/generate.ts
examples/nestjs-api
```

Likely new test locations:

```txt
packages/core/src/__tests__/pipeline.test.ts
packages/core/src/__tests__/serializer.test.ts
packages/core/src/__tests__/config.test.ts
packages/cli/src/__tests__/commands.test.ts
```

If you prefer keeping test files outside `src`, use:

```txt
packages/core/test/pipeline.test.ts
packages/core/test/serializer.test.ts
packages/core/test/config.test.ts
packages/cli/test/commands.test.ts
```

Pick one convention and stay consistent.

---

## Phase 1A User Story

As a Specord maintainer, I want `specord inspect` to be covered by deterministic tests so that future work on config overrides and OpenAPI generation does not accidentally break route extraction, schema extraction, diagnostics, or serialized output.

---

## Implementation Plan

## 1. Add Fixture Test Harness

Create a helper that runs the real core pipeline against `examples/nestjs-api`.

Recommended file:

```txt
packages/core/test/helpers/inspect-fixture.ts
```

Example shape:

```ts
import path from "node:path";
import { inspect, resolveConfig } from "@specord/core";
import type { InspectionModel } from "@specord/types";

const repoRoot = path.resolve(__dirname, "../../../../");

export function inspectNestFixture(): InspectionModel {
  const fixtureRoot = path.join(repoRoot, "examples/nestjs-api");

  const resolvedConfig = resolveConfig(
    {
      project: path.join(fixtureRoot, "tsconfig.json"),
      root: path.join(fixtureRoot, "src"),
    },
    undefined,
  );

  return inspect(resolvedConfig);
}
```

If direct `__dirname` is awkward under ESM, use `import.meta.url`:

```ts
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

---

## 2. Normalize the Inspection Model Before Snapshotting

The model includes fields that are intentionally unstable or machine-specific.

Normalize:

- `source.inspectedAt`
- absolute paths in `source.project`
- absolute paths in `source.root`
- path separators
- ordering, if asserting raw model instead of serialized JSON

Recommended helper:

```ts
import type { InspectionModel } from "@specord/types";

export function normalizeInspectionModel(
  model: InspectionModel,
): InspectionModel {
  return {
    ...model,
    source: {
      ...model.source,
      project: "<fixture-tsconfig>",
      root: "<fixture-root>",
      inspectedAt: "<inspected-at>",
    },
  };
}
```

Since `serializeInspectionModel()` already sorts operations, schemas, and diagnostics deterministically, snapshotting serialized output is also acceptable.

Recommended approach:

```ts
const model = normalizeInspectionModel(inspectNestFixture());
const json = serializeInspectionModel(model);
expect(json).toMatchSnapshot();
```

---

## 3. Add Full Snapshot Test

Create:

```txt
packages/core/test/pipeline.snapshot.test.ts
```

Test:

```ts
import { describe, expect, it } from "vitest";
import { serializeInspectionModel } from "@specord/core";
import { inspectNestFixture } from "./helpers/inspect-fixture";
import { normalizeInspectionModel } from "./helpers/normalize-inspection-model";

describe("inspect pipeline snapshot", () => {
  it("produces a stable normalized inspection model", () => {
    const model = normalizeInspectionModel(inspectNestFixture());
    const json = serializeInspectionModel(model);

    expect(json).toMatchSnapshot();
  });
});
```

This is the high-level safety net.

---

## 4. Add Explicit Acceptance Tests

Do not rely only on snapshots.

Snapshots tell you something changed. Explicit tests tell you what broke.

Create:

```txt
packages/core/test/pipeline.acceptance.test.ts
```

### 4.1 Controller Discovery

Expected current fixture behavior:

```txt
AuthController
HealthController
ProductsController
UsersController
```

Test:

```ts
it("discovers expected controllers", () => {
  const model = inspectNestFixture();

  const controllers = new Set(model.operations.map((op) => op.controller));

  expect([...controllers].sort()).toEqual([
    "AuthController",
    "HealthController",
    "ProductsController",
    "UsersController",
  ]);
});
```

---

### 4.2 Operation Count

Expected current behavior:

```txt
15 operations
```

Test:

```ts
it("extracts expected operation count", () => {
  const model = inspectNestFixture();

  expect(model.operations).toHaveLength(15);
});
```

---

### 4.3 Schema Count

Expected current behavior:

```txt
8 schemas
```

Test:

```ts
it("extracts expected schema count", () => {
  const model = inspectNestFixture();

  expect(Object.keys(model.schemas)).toHaveLength(8);
});
```

---

### 4.4 Expected Schema Names

Expected current behavior:

```txt
CreateProductDto
CreateUserDto
LoginUserDto
PaginationDto
RefreshTokenDto
UpdateProductDto
UpdateUserDto
User
```

Test:

```ts
it("extracts expected schema names", () => {
  const model = inspectNestFixture();

  expect(Object.keys(model.schemas).sort()).toEqual([
    "CreateProductDto",
    "CreateUserDto",
    "LoginUserDto",
    "PaginationDto",
    "RefreshTokenDto",
    "UpdateProductDto",
    "UpdateUserDto",
    "User",
  ]);
});
```

---

### 4.5 Route Path Normalization

Verify NestJS `:id` routes become OpenAPI `{id}` routes.

Test:

```ts
it("normalizes Nest path params to OpenAPI template params", () => {
  const model = inspectNestFixture();

  expect(model.operations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: "/users/{id}" }),
      expect.objectContaining({ path: "/products/{id}" }),
    ]),
  );
});
```

---

### 4.6 Request Body Extraction

Test:

```ts
it("extracts request body DTO refs", () => {
  const model = inspectNestFixture();

  expect(model.operations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "UsersController.create",
        requestBody: expect.objectContaining({
          schema: { kind: "ref", name: "CreateUserDto" },
        }),
      }),
      expect.objectContaining({
        id: "ProductsController.create",
        requestBody: expect.objectContaining({
          schema: { kind: "ref", name: "CreateProductDto" },
        }),
      }),
    ]),
  );
});
```

Adjust handler names if the fixture uses different method names.

---

### 4.7 Query DTO Extraction

Current behavior appears to represent `@Query() dto: PaginationDto` as a query param with a ref to `PaginationDto`, not as expanded individual query params.

This should be explicitly tested as current behavior.

Test:

```ts
it("represents query DTO params as query refs", () => {
  const model = inspectNestFixture();

  const productsList = model.operations.find(
    (op) =>
      op.controller === "ProductsController" &&
      op.method === "get" &&
      op.path === "/products",
  );

  expect(productsList?.params).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: "PaginationDto",
        in: "query",
        type: { kind: "ref", name: "PaginationDto" },
      }),
    ]),
  );
});
```

This protects the current implementation while leaving room for Phase 1B or later to expand query DTOs properly.

---

### 4.8 Guard Diagnostics

Current behavior:

- routes with class-level or method-level `@UseGuards()` get `EXTRACTOR_UNRESOLVED_SECURITY`
- security inference becomes unresolved

Test:

```ts
it("emits unresolved security diagnostics for guarded routes", () => {
  const model = inspectNestFixture();

  const guardedOps = model.operations.filter(
    (op) => op.security.status === "unresolved",
  );

  expect(guardedOps.length).toBeGreaterThan(0);

  expect(
    guardedOps.some((op) =>
      op.diagnostics.some(
        (diag) => diag.code === "EXTRACTOR_UNRESOLVED_SECURITY",
      ),
    ),
  ).toBe(true);
});
```

---

### 4.9 Response Diagnostics

Current behavior:

- ambiguous, anonymous, library, or undiscovered return types emit `EXTRACTOR_UNRESOLVED_RESPONSE`

Test:

```ts
it("emits unresolved response diagnostics for non-reducible return types", () => {
  const model = inspectNestFixture();

  const responseDiagnostics = model.operations.flatMap((op) =>
    op.diagnostics.filter(
      (diag) => diag.code === "EXTRACTOR_UNRESOLVED_RESPONSE",
    ),
  );

  expect(responseDiagnostics.length).toBeGreaterThan(0);
});
```

If the current expected number is stable, assert it directly:

```ts
expect(responseDiagnostics).toHaveLength(13);
```

Use direct count only if you want to freeze the current fixture behavior tightly.

---

### 4.10 Mapped Type Diagnostics

Current behavior:

- `PartialType`, `PickType`, `OmitType`, and `IntersectionType` are detected
- unresolved mapped types become skeleton schemas
- diagnostics use `EXTRACTOR_UNSUPPORTED_MAPPED_TYPE`

Test:

```ts
it("detects unsupported mapped types", () => {
  const model = inspectNestFixture();

  const diagnostics = model.diagnostics.filter(
    (diag) => diag.code === "EXTRACTOR_UNSUPPORTED_MAPPED_TYPE",
  );

  expect(diagnostics).toHaveLength(2);

  expect(model.schemas.UpdateUserDto).toMatchObject({
    name: "UpdateUserDto",
    properties: {},
    required: [],
    inference: expect.objectContaining({
      status: "inferred-with-warning",
    }),
  });

  expect(model.schemas.UpdateProductDto).toMatchObject({
    name: "UpdateProductDto",
    properties: {},
    required: [],
    inference: expect.objectContaining({
      status: "inferred-with-warning",
    }),
  });
});
```

---

## 5. Add Serializer Determinism Tests

Create:

```txt
packages/core/test/serializer.test.ts
```

The serializer is important because snapshot stability depends on it.

Test repeated output:

```ts
import { describe, expect, it } from "vitest";
import { serializeInspectionModel } from "@specord/core";
import { inspectNestFixture } from "./helpers/inspect-fixture";
import { normalizeInspectionModel } from "./helpers/normalize-inspection-model";

describe("serializeInspectionModel", () => {
  it("serializes equivalent models deterministically", () => {
    const first = normalizeInspectionModel(inspectNestFixture());
    const second = normalizeInspectionModel(inspectNestFixture());

    expect(serializeInspectionModel(first)).toEqual(
      serializeInspectionModel(second),
    );
  });
});
```

Also test sorting behavior with a small artificial model if needed.

Recommended direct sort test:

```ts
it("sorts operations by path, method, and id", () => {
  const model = makeMinimalInspectionModel({
    operations: [
      { id: "B.z", method: "post", path: "/b" },
      { id: "A.a", method: "get", path: "/a" },
      { id: "A.b", method: "post", path: "/a" },
    ],
  });

  const json = serializeInspectionModel(model);
  const parsed = JSON.parse(json);

  expect(parsed.operations.map((op: any) => op.id)).toEqual([
    "A.a",
    "A.b",
    "B.z",
  ]);
});
```

---

## 6. Add Config Loader Tests

Create:

```txt
packages/core/test/config.test.ts
```

Test `resolveConfig` without needing filesystem-heavy config loading.

### 6.1 CLI Flags Required Without Config

```ts
it("requires project and root when config does not provide them", () => {
  expect(() => resolveConfig({}, undefined)).toThrow(/Missing --project/);
});
```

### 6.2 CLI Overrides Config

```ts
it("gives CLI flags precedence over config values", () => {
  const resolved = resolveConfig(
    {
      project: "cli-tsconfig.json",
      root: "cli-src",
    },
    {
      source: {
        project: "config-tsconfig.json",
        root: "config-src",
      },
    },
  );

  expect(resolved.project).toContain("cli-tsconfig.json");
  expect(resolved.root).toContain("cli-src");
});
```

### 6.3 Config Values Work Without CLI

```ts
it("uses config source values when CLI flags are absent", () => {
  const resolved = resolveConfig(
    {},
    {
      source: {
        project: "config-tsconfig.json",
        root: "config-src",
      },
    },
  );

  expect(resolved.project).toContain("config-tsconfig.json");
  expect(resolved.root).toContain("config-src");
});
```

### 6.4 Deprecated Versioning Type Rejection

This test may require calling `loadConfig()` against a temporary config file.

Expected behavior:

```txt
routing.versioning.type should throw and instruct the user to use strategy
```

Test shape:

```ts
it("rejects deprecated routing.versioning.type", async () => {
  const tempDir = await createTempProjectWithConfig(`
    export default {
      source: { project: "tsconfig.json", root: "src" },
      routing: {
        versioning: { type: "uri" }
      }
    };
  `);

  await expect(loadConfig(tempDir)).rejects.toThrow(/strategy/);
});
```

---

## 7. Add Global Prefix Behavior Test

Current code already applies `routing.globalPrefix` in the pipeline before route extraction.

Test it directly so it does not regress.

```ts
it("applies routing.globalPrefix to extracted paths", () => {
  const fixtureRoot = getNestFixtureRoot();

  const model = inspect(
    resolveConfig(
      {
        project: path.join(fixtureRoot, "tsconfig.json"),
        root: path.join(fixtureRoot, "src"),
      },
      {
        routing: {
          globalPrefix: "api",
        },
      },
    ),
  );

  expect(model.operations.every((op) => op.path.startsWith("/api/"))).toBe(
    true,
  );
});
```

Also test without prefix:

```ts
it("does not add global prefix when config is absent", () => {
  const model = inspectNestFixture();

  expect(model.operations.some((op) => op.path === "/users")).toBe(true);
  expect(model.operations.every((op) => !op.path.startsWith("/api/"))).toBe(
    true,
  );
});
```

---

## 8. Add CLI Command Tests

The CLI layer is thin, so do not over-test it yet.

Focus on behavior, not internals.

Create:

```txt
packages/cli/test/commands.test.ts
```

### 8.1 `generate` Is Still Explicitly Unimplemented

Current behavior is intentional and should be protected until Phase 2.

Test shape:

```ts
it("keeps generate explicitly unimplemented", async () => {
  const stderrSpy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation(() => true);
  const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
    throw new Error("process.exit called");
  }) as never);

  await expect(runGenerate()).rejects.toThrow("process.exit called");

  expect(stderrSpy).toHaveBeenCalledWith(
    expect.stringContaining("not yet implemented"),
  );

  stderrSpy.mockRestore();
  exitSpy.mockRestore();
});
```

If testing `process.exit` feels too messy, skip CLI unit tests for now and cover command behavior later through integration tests.

---

## Acceptance Criteria

Phase 1A is complete when:

```txt
pnpm test passes
pnpm --filter @specord/core test passes
current fixture inspection output has a snapshot test
controller discovery is explicitly tested
operation count is explicitly tested
schema count is explicitly tested
schema names are explicitly tested
path normalization is explicitly tested
request body extraction is explicitly tested
query DTO current behavior is explicitly tested
mapped type diagnostics are explicitly tested
security diagnostics are explicitly tested
response diagnostics are explicitly tested
serializer determinism is explicitly tested
config precedence is explicitly tested
routing.globalPrefix behavior is explicitly tested
CI runs build and tests on push and pull request
```

---

## Expected Current Fixture Assertions

These are the values to freeze unless the fixture has changed.

```txt
controllers: 4
operations: 15
schemas: 8
mapped type diagnostics: 2
unresolved security diagnostics: 12
unresolved response diagnostics: 13
unsupported decorator diagnostics: 1
```

Expected controllers:

```txt
AuthController
HealthController
ProductsController
UsersController
```

Expected schemas:

```txt
CreateProductDto
CreateUserDto
LoginUserDto
PaginationDto
RefreshTokenDto
UpdateProductDto
UpdateUserDto
User
```

Expected diagnostic codes currently active:

```txt
EXTRACTOR_UNRESOLVED_RESPONSE
EXTRACTOR_UNRESOLVED_SECURITY
EXTRACTOR_UNSUPPORTED_MAPPED_TYPE
EXTRACTOR_UNSUPPORTED_DECORATOR
```

Additional diagnostic codes implemented or expected in the pipeline:

```txt
EXTRACTOR_ROUTE_CONFLICT
EXTRACTOR_INVALID_PATH_TEMPLATE
```

---

## Recommended File Additions

```txt
packages/core/test/helpers/inspect-fixture.ts
packages/core/test/helpers/normalize-inspection-model.ts
packages/core/test/pipeline.snapshot.test.ts
packages/core/test/pipeline.acceptance.test.ts
packages/core/test/serializer.test.ts
packages/core/test/config.test.ts
packages/cli/test/commands.test.ts
.github/workflows/ci.yml
```

If you want to move faster, start with only:

```txt
packages/core/test/helpers/inspect-fixture.ts
packages/core/test/helpers/normalize-inspection-model.ts
packages/core/test/pipeline.snapshot.test.ts
packages/core/test/pipeline.acceptance.test.ts
.github/workflows/ci.yml
```

---

## CI Specification

Add:

```txt
.github/workflows/ci.yml
```

Recommended workflow:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main
      - develop

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test
```

If the repo does not yet commit a lockfile, either commit the lockfile or temporarily remove `--frozen-lockfile`. Prefer committing the lockfile.

---

## Recommended Commit Plan

### Commit 1

```txt
test(core): add fixture inspection test harness
```

Includes:

```txt
inspect-fixture.ts
normalize-inspection-model.ts
basic test setup fixes if needed
```

---

### Commit 2

```txt
test(core): snapshot normalized inspection model
```

Includes:

```txt
pipeline.snapshot.test.ts
initial snapshot file
```

---

### Commit 3

```txt
test(core): assert phase 0 fixture acceptance criteria
```

Includes tests for:

```txt
controllers
operation count
schema count
schema names
path normalization
request bodies
query DTO representation
mapped type diagnostics
security diagnostics
response diagnostics
```

---

### Commit 4

```txt
test(core): cover serializer determinism and config precedence
```

Includes:

```txt
serializer.test.ts
config.test.ts
global prefix tests
```

---

### Commit 5

```txt
ci: run build and tests on push and pull request
```

Includes:

```txt
.github/workflows/ci.yml
```

---

## Implementation Notes

### 1. Avoid Testing Private Functions Too Early

Do not overfocus on private helpers inside extractors.

Prefer testing the public behavior through:

```ts
inspect(resolvedConfig);
serializeInspectionModel(model);
resolveConfig(flags, config);
```

This keeps tests aligned with product behavior instead of implementation details.

---

### 2. Snapshot Serialized JSON, Not Raw Objects

Prefer:

```ts
expect(serializeInspectionModel(normalizedModel)).toMatchSnapshot();
```

Instead of:

```ts
expect(normalizedModel).toMatchSnapshot();
```

Reason: the serializer itself is part of the product contract for `specord inspect`.

---

### 3. Freeze Known Limitations Explicitly

The current behavior has known limitations. Tests should name them clearly.

For example:

```txt
UpdateUserDto is a skeleton because PartialType is detected but not resolved yet.
PaginationDto query params are represented as a DTO ref, not expanded fields yet.
Guard-backed routes produce unresolved security until config overrides are applied.
Anonymous/library return types produce unresolved response diagnostics.
```

This makes future improvements intentional instead of accidental.

---

### 4. Keep Phase 1A Separate From Phase 1B

Do not mix override application into the testing milestone.

Phase 1A should protect current behavior.

Phase 1B should change behavior through tested override application.

---

## Risks

### Risk 1: Snapshot Churn

Cause:

```txt
absolute paths
timestamps
unordered output
```

Mitigation:

```txt
normalize inspectedAt
normalize project/root
snapshot serialized JSON
rely on serializer sorting
```

---

### Risk 2: Brittle Handler Names

Some tests may refer to exact operation IDs like:

```txt
UsersController.create
ProductsController.create
```

If fixture handler names change, tests break.

Mitigation:

Use exact operation IDs only where useful. For broader behavior, match by method/path/controller.

---

### Risk 3: Testing Too Much CLI Too Early

The CLI mostly delegates to core.

Mitigation:

Keep CLI tests minimal. Core tests matter more right now.

---

### Risk 4: OpenAPI Work Starts Too Soon

If OpenAPI emission starts before tests, extraction regressions become harder to isolate.

Mitigation:

Do not start `@specord/openapi` implementation until Phase 1A passes.

---

## Definition of Done

```txt
Specord Phase 1A is done when the current inspect behavior is repeatable, snapshot-tested, covered by explicit acceptance assertions, and enforced by CI.

The extractor does not need to be perfect yet.
It needs to be stable, honest, and protected.
```

---

## Next Phase After This

After Phase 1A, move to:

```txt
Phase 1B: Config Override Application
```

Phase 1B should apply user config to the inspection model before OpenAPI generation.

Recommended Phase 1B order:

```txt
1. operation response overrides
2. operation security overrides
3. operation metadata overrides
4. schema overrides
5. tests for each override category
6. diagnostics resolved or downgraded when an override is applied
```

Only after Phase 1B should you start:

```txt
Phase 2: OpenAPI 3.1 Emission
```

---

## Final Recommendation

The next actual development task should be:

```txt
Create packages/core/test/pipeline.acceptance.test.ts and lock the 15-operation / 8-schema fixture behavior.
```

That is the highest-leverage next step.

Do not build the OpenAPI emitter yet.
Do not expand mapped types yet.
Do not redesign the package structure.

Freeze the extractor first.
