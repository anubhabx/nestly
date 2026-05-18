export type ApiHistoryChangeType =
  | "added"
  | "removed"
  | "changed"
  | "deprecated"
  | "security"
  | "implementation";

export type ApiHistoryConfidence = "high" | "medium" | "low";

export type ApiHistoryRecord = {
  operationId: string;
  method: string;
  path: string;
  version?: string;
  releaseTag?: string;
  commit: string;
  date: string;
  author?: string;
  changeType: ApiHistoryChangeType;
  breaking: boolean;
  confidence: ApiHistoryConfidence;
  summary: string;
  affectedFields: string[];
  sourceFiles: string[];
};
