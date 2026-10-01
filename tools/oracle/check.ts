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

/**
 * Values that deliberately differ from the prototype (each is a fix, listed in docs/PARITY.md). They are removed from
 * both sides so the rest of the screen still has to match exactly.
 *  - canClaim, claimClosedNote: the prototype offers "This is mine" on posts that are already Reunited/Resolved;
 *    the app only offers it on open posts.
 */
const INTENTIONAL_DEVIATIONS = ['canClaim', 'claimClosedNote'];
const withoutDeviations = <T extends Record<string, unknown>>(vals: T): T => {
  const copy: Record<string, unknown> = { ...vals };
  for (const k of INTENTIONAL_DEVIATIONS) delete copy[k];
  return copy as T;
};

const protoVals = (patch: Record<string, unknown>) => {
  const c = new Component();
  c.props = {};
  c.state = { ...c.state, ...patch };
  return normalise(withoutDeviations(c.renderVals()));
};

const portVals = (patch: Record<string, unknown>) => {
  const s = new Store();
  s.state = { ...initialState, ...(patch as object) } as typeof initialState;
  return normalise(withoutDeviations(buildVals(s) as Record<string, unknown>));
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
