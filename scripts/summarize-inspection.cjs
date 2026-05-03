/**
 * Pretty-print a summary of a specord inspection model from stdin.
 * Usage: specord inspect ... | node scripts/summarize-inspection.cjs
 */
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf8'));

const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW= '\x1b[33m';
const RED   = '\x1b[31m';
const CYAN  = '\x1b[36m';
const MAGENTA = '\x1b[35m';

console.log();
console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${CYAN}  SPECORD INSPECT — Fixture Report${RESET}`);
console.log(`${BOLD}${CYAN}══════════════════════════════════════════════════════════${RESET}`);
console.log();
console.log(`${DIM}Version:     ${RESET}${data.source.version}`);
console.log(`${DIM}Inspected:   ${RESET}${data.source.inspectedAt}`);
console.log();

// ── Operations ──────────────────────────────────────
const controllers = [...new Set(data.operations.map(o => o.controller))].sort();
console.log(`${BOLD}📦 Controllers (${controllers.length})${RESET}`);
console.log();

for (const ctrl of controllers) {
  const ops = data.operations.filter(o => o.controller === ctrl);
  const guardedOps = ops.filter(o => o.security.status === 'unresolved');
  const guardTag = guardedOps.length > 0 ? ` ${YELLOW}🔒 guarded${RESET}` : '';
  console.log(`  ${BOLD}${ctrl}${RESET}${guardTag}`);

  for (const op of ops) {
    const method = op.method.toUpperCase().padEnd(7);
    const methodColor = { GET: GREEN, POST: CYAN, PUT: YELLOW, PATCH: YELLOW, DELETE: RED }[op.method.toUpperCase()] || RESET;

    let paramInfo = '';
    if (op.params.length > 0) {
      paramInfo += op.params.map(p => `${p.in}:${p.name}`).join(', ');
    }
    if (op.requestBody) {
      const schema = op.requestBody.schema;
      paramInfo += (paramInfo ? ', ' : '') + `body:${schema.kind === 'ref' ? schema.name : schema.kind}`;
    }
    if (paramInfo) paramInfo = ` ${DIM}(${paramInfo})${RESET}`;

    const diagCount = op.diagnostics.length;
    const diagTag = diagCount > 0 ? ` ${YELLOW}⚠ ${diagCount}${RESET}` : ` ${GREEN}✓${RESET}`;

    console.log(`    ${methodColor}${method}${RESET} ${op.path}${paramInfo}${diagTag}`);
  }
  console.log();
}

// ── Schemas ──────────────────────────────────────
const schemaNames = Object.keys(data.schemas).sort();
console.log(`${BOLD}📋 Schemas (${schemaNames.length})${RESET}`);
console.log();

for (const name of schemaNames) {
  const schema = data.schemas[name];
  const propNames = Object.keys(schema.properties);
  const reqCount = schema.required.length;

  let statusIcon = GREEN + '✓' + RESET;
  if (schema.inference.status === 'inferred-with-warning') {
    statusIcon = YELLOW + '⚠' + RESET;
  } else if (schema.inference.status === 'unresolved') {
    statusIcon = RED + '✗' + RESET;
  }

  const propsStr = propNames.length > 0
    ? `${DIM}{ ${propNames.join(', ')} }${RESET}`
    : `${DIM}{ empty }${RESET}`;

  console.log(`  ${statusIcon} ${BOLD}${name}${RESET} — ${propNames.length} props, ${reqCount} required`);
  console.log(`    ${propsStr}`);

  if (schema.inference.status === 'inferred-with-warning') {
    console.log(`    ${YELLOW}↳ ${schema.inference.reason}${RESET}`);
  }

  console.log(`    ${DIM}${schema.source.file}:${schema.source.line}${RESET}`);
}

// ── Diagnostics ──────────────────────────────────────
const allDiags = [...data.diagnostics];
data.operations.forEach(op => allDiags.push(...op.diagnostics));

const diagsByCode = {};
for (const d of allDiags) {
  if (!diagsByCode[d.code]) diagsByCode[d.code] = [];
  diagsByCode[d.code].push(d);
}

console.log();
console.log(`${BOLD}🔍 Diagnostics (${allDiags.length} total)${RESET}`);
console.log();

for (const [code, diags] of Object.entries(diagsByCode).sort()) {
  const color = diags[0].severity === 'error' ? RED : diags[0].severity === 'warning' ? YELLOW : DIM;
  console.log(`  ${color}${code}${RESET} × ${diags.length}`);
  for (const d of diags) {
    const loc = d.source ? `${d.source.file}:${d.source.line}` : '';
    console.log(`    ${DIM}${d.subject || ''}  ${loc}${RESET}`);
  }
}

// ── Summary ──────────────────────────────────────
console.log();
console.log(`${BOLD}${CYAN}──────────────────────────────────────────────────────────${RESET}`);
console.log(`  ${BOLD}Controllers:${RESET}  ${controllers.length}`);
console.log(`  ${BOLD}Operations:${RESET}   ${data.operations.length}`);
console.log(`  ${BOLD}Schemas:${RESET}      ${schemaNames.length}`);
console.log(`  ${BOLD}Diagnostics:${RESET}  ${allDiags.length}`);
console.log(`${BOLD}${CYAN}──────────────────────────────────────────────────────────${RESET}`);
console.log();
