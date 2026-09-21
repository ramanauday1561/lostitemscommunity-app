/**
 * Golden-master parity check.
 *
 * Runs the prototype's own renderVals() and this app's buildVals() over the
 * same state matrix and diffs the data. Styles are excluded (CSS vs RN); what
 * is compared is every label, id, count, ordering and computed value.
 */
import { makeComponent } from './extract.mjs';
import { CASES } from './cases.mjs';
import { diff, normalise } from './normalise.mjs';
import { Store, initialState } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

const Component: any = makeComponent();

const protoVals = (patch: Record<string, unknown>) => {
  const c = new Component();
  c.props = {};
  c.state = { ...c.state, ...patch };
  return normalise(c.renderVals());
};

const portVals = (patch: Record<string, unknown>) => {
  const s = new Store();
  s.state = { ...initialState, ...(patch as object) } as typeof initialState;
  return normalise(buildVals(s));
};

let failed = 0;
const rows: string[] = [];

for (const [name, patch] of Object.entries(CASES)) {
  let d: ReturnType<typeof diff>;
  try {
    d = diff(protoVals(patch as Record<string, unknown>), portVals(patch as Record<string, unknown>));
  } catch (e) {
    rows.push(`FAIL ${name}: threw ${(e as Error).message}`);
    failed++;
    continue;
  }
  if (d.length === 0) { rows.push(`  ok  ${name}`); continue; }
  failed++;
  rows.push(`FAIL ${name}  (${d.length} mismatches)`);
  for (const m of d.slice(0, 6)) {
    rows.push(`        ${m.path}\n          prototype: ${JSON.stringify(m.proto)?.slice(0, 120)}\n          port:      ${JSON.stringify(m.port)?.slice(0, 120)}`);
  }
}

console.log(rows.join('\n'));
console.log(`\n${Object.keys(CASES).length - failed}/${Object.keys(CASES).length} cases match the prototype.`);
process.exit(failed ? 1 : 0);
