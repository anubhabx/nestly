import type { ApiHistoryChangeType, ApiHistoryRecord } from "@specord/types";
import { hashSnapshotInput } from "./snapshot-cache.js";

export type DiffOpenApiSnapshotsOptions = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  commit: string;
  date: string;
  author?: string;
  releaseTag?: string;
};

type OperationSnapshot = {
  key: string;
  operationId: string;
  method: string;
  path: string;
  operation: Record<string, unknown>;
};

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "patch",
  "options",
  "head",
  "trace",
]);

const CHANGE_ORDER: Record<ApiHistoryChangeType, number> = {
  removed: 0,
  added: 1,
  security: 2,
  deprecated: 3,
  changed: 4,
  implementation: 5,
};

export function diffOpenApiSnapshots(
  options: DiffOpenApiSnapshotsOptions,
): ApiHistoryRecord[] {
  const beforeOperations = collectOperations(options.before);
  const afterOperations = collectOperations(options.after);
  const records: ApiHistoryRecord[] = [];

  for (const before of beforeOperations.values()) {
    if (!afterOperations.has(before.key)) {
      records.push(
        createRecord(options, before, {
          changeType: "removed",
          breaking: true,
          summary: `Removed ${before.method.toUpperCase()} ${before.path}.`,
          affectedFields: ["operation"],
        }),
      );
    }
  }

  for (const after of afterOperations.values()) {
    const before = beforeOperations.get(after.key);

    if (!before) {
      records.push(
        createRecord(options, after, {
          changeType: "added",
          breaking: false,
          summary: `Added ${after.method.toUpperCase()} ${after.path}.`,
          affectedFields: ["operation"],
        }),
      );
      continue;
    }

    records.push(...diffOperation(options, before, after));
  }

  return records.sort(compareRecords);
}

function diffOperation(
  options: DiffOpenApiSnapshotsOptions,
  before: OperationSnapshot,
  after: OperationSnapshot,
): ApiHistoryRecord[] {
  const records: ApiHistoryRecord[] = [];

  if (!deepEqual(before.operation.security, after.operation.security)) {
    records.push(
      createRecord(options, after, {
        changeType: "security",
        breaking: true,
        summary: `Security changed for ${after.operationId}.`,
        affectedFields: ["security"],
      }),
    );
  }

  if (before.operation.deprecated !== true && after.operation.deprecated === true) {
    records.push(
      createRecord(options, after, {
        changeType: "deprecated",
        breaking: false,
        summary: `${after.operationId} is now deprecated.`,
        affectedFields: ["deprecated"],
      }),
    );
  }

  const affectedFields = changedFields(before.operation, after.operation).filter(
    (field) => field !== "security" && field !== "deprecated",
  );

  if (affectedFields.length > 0) {
    records.push(
      createRecord(options, after, {
        changeType: "changed",
        breaking: false,
        summary: `${after.operationId} changed fields: ${affectedFields.join(", ")}.`,
        affectedFields,
      }),
    );
  }

  return records;
}

function createRecord(
  options: DiffOpenApiSnapshotsOptions,
  operation: OperationSnapshot,
  details: {
    changeType: ApiHistoryChangeType;
    breaking: boolean;
    summary: string;
    affectedFields: string[];
  },
): ApiHistoryRecord {
  return {
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    version: readInfoVersion(options.after),
    releaseTag: options.releaseTag,
    commit: options.commit,
    date: options.date,
    author: options.author,
    changeType: details.changeType,
    breaking: details.breaking,
    confidence: "high",
    summary: details.summary,
    affectedFields: details.affectedFields,
    sourceFiles: [],
  };
}

function collectOperations(
  document: Record<string, unknown>,
): Map<string, OperationSnapshot> {
  const operations = new Map<string, OperationSnapshot>();
  const paths = readRecord(document.paths);

  for (const pathKey of Object.keys(paths).sort()) {
    const pathItem = readRecord(paths[pathKey]);
    for (const method of Object.keys(pathItem).sort()) {
      if (!HTTP_METHODS.has(method)) continue;

      const operation = readRecord(pathItem[method]);
      const operationId = readOperationId(operation, method, pathKey);
      operations.set(operationId, {
        key: operationId,
        operationId,
        method,
        path: pathKey,
        operation,
      });
    }
  }

  return operations;
}

function readOperationId(
  operation: Record<string, unknown>,
  method: string,
  pathKey: string,
): string {
  return typeof operation.operationId === "string"
    ? operation.operationId
    : `${method.toUpperCase()} ${pathKey}`;
}

function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((field) => !deepEqual(before[field], after[field]))
    .sort();
}

function deepEqual(left: unknown, right: unknown): boolean {
  return hashSnapshotInput(left) === hashSnapshotInput(right);
}

function readInfoVersion(document: Record<string, unknown>): string | undefined {
  const info = readRecord(document.info);
  return typeof info.version === "string" ? info.version : undefined;
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value)
    ? value
    : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareRecords(left: ApiHistoryRecord, right: ApiHistoryRecord): number {
  return (
    CHANGE_ORDER[left.changeType] - CHANGE_ORDER[right.changeType] ||
    left.operationId.localeCompare(right.operationId) ||
    left.method.localeCompare(right.method) ||
    left.path.localeCompare(right.path)
  );
}
