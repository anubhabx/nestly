// ============================================================================
// specord generate — stub for Phase 2
// ============================================================================

/**
 * Stub for `specord generate`.
 * This command will produce OpenAPI 3.1 output in Phase 2.
 * For now, it exits with a clear message.
 */
export async function runGenerate(): Promise<void> {
  process.stderr.write(
    "[specord] `specord generate` is not yet implemented.\n" +
    "This command will produce OpenAPI 3.1 output in a future release.\n" +
    "Use `specord inspect` for the internal extraction model.\n",
  );
  process.exit(1);
}
