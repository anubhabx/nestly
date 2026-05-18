import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type SnapshotCacheKeyInput = {
  commit: string;
  configHash: string;
  specordVersion: string;
  lockfileHash?: string;
};

export type OpenApiSnapshotCacheEntry = {
  key: string;
  path: string;
  inputs: SnapshotCacheKeyInput;
  document: Record<string, unknown>;
  createdAt: string;
};

export type WriteOpenApiSnapshotOptions = {
  repoRoot: string;
  inputs: SnapshotCacheKeyInput;
  document: Record<string, unknown>;
  createdAt?: string;
};

export type ReadOpenApiSnapshotOptions = {
  repoRoot: string;
  inputs: SnapshotCacheKeyInput;
};

type PersistedSnapshotEntry = Omit<OpenApiSnapshotCacheEntry, "path">;

export function resolveSnapshotCacheDir(repoRoot: string): string {
  return path.join(repoRoot, ".git", "specord", "cache", "snapshots");
}

export function createSnapshotCacheKey(input: SnapshotCacheKeyInput): string {
  return hashSnapshotInput({
    commit: input.commit,
    configHash: input.configHash,
    specordVersion: input.specordVersion,
    lockfileHash: input.lockfileHash ?? null,
  });
}

export function hashSnapshotInput(input: unknown): string {
  return crypto
    .createHash("sha256")
    .update(stableStringify(input))
    .digest("hex");
}

export function writeOpenApiSnapshot(
  options: WriteOpenApiSnapshotOptions,
): OpenApiSnapshotCacheEntry {
  const cacheDir = resolveSnapshotCacheDir(options.repoRoot);
  const key = createSnapshotCacheKey(options.inputs);
  const snapshotPath = path.join(cacheDir, `${key}.json`);
  const entry: PersistedSnapshotEntry = {
    key,
    inputs: options.inputs,
    document: options.document,
    createdAt: options.createdAt ?? new Date().toISOString(),
  };

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(snapshotPath, `${JSON.stringify(entry, null, 2)}\n`, "utf8");

  return {
    ...entry,
    path: snapshotPath,
  };
}

export function readOpenApiSnapshot(
  options: ReadOpenApiSnapshotOptions,
): OpenApiSnapshotCacheEntry | undefined {
  const cacheDir = resolveSnapshotCacheDir(options.repoRoot);
  const key = createSnapshotCacheKey(options.inputs);
  const snapshotPath = path.join(cacheDir, `${key}.json`);

  if (!fs.existsSync(snapshotPath)) {
    return undefined;
  }

  const entry = JSON.parse(
    fs.readFileSync(snapshotPath, "utf8"),
  ) as PersistedSnapshotEntry;

  if (entry.key !== key) {
    return undefined;
  }

  return {
    ...entry,
    path: snapshotPath,
  };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortStable(value)) ?? "undefined";
}

function sortStable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortStable);
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, sortStable(entryValue)]),
    );
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
