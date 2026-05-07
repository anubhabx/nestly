// ============================================================================
// Snapshot test — full normalized inspection model
//
// This is the high-level safety net. Any change to the extractor's output
// will cause this snapshot to break, forcing explicit review.
// ============================================================================

import { describe, expect, it } from "vitest";
import { serializeInspectionModel } from "../src/index.ts";
import { inspectNestFixture } from "./helpers/inspect-fixture.js";
import { normalizeInspectionModel } from "./helpers/normalize-inspection-model.js";

describe("inspect pipeline snapshot", () => {
  it("produces a stable normalized inspection model", () => {
    const model = normalizeInspectionModel(inspectNestFixture());
    const json = serializeInspectionModel(model);

    expect(json).toMatchSnapshot();
  });
});
