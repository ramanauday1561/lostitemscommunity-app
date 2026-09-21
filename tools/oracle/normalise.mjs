// Styles differ by necessity (CSS vs React Native), so the diff compares data
// only: functions become a marker and style-bearing keys are dropped.
const STYLE_KEY = /(style|Style|chip|chipFloat|markStyle|barStyle|tint|color|Color)$/;

export function normalise(v) {
  if (typeof v === 'function') return '«fn»';
  // The prototype's image paths point at public/images/, which does not exist;
  // the port resolves bare filenames through an asset map instead.
  if (typeof v === 'string') return v.replace('public/images/', '');
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(normalise);
  const out = {};
  for (const k of Object.keys(v).sort()) {
    if (STYLE_KEY.test(k)) continue;
    out[k] = normalise(v[k]);
  }
  return out;
}

/** Keys that exist only in one implementation are reported, not failed on. */
export function diff(a, b, pathStr = '', acc = []) {
  const ka = a && typeof a === 'object' && !Array.isArray(a) ? Object.keys(a) : null;
  const kb = b && typeof b === 'object' && !Array.isArray(b) ? Object.keys(b) : null;
  if (ka && kb) {
    for (const k of ka) {
      if (!(k in b)) continue; // only compare shared keys
      diff(a[k], b[k], pathStr ? `${pathStr}.${k}` : k, acc);
    }
    return acc;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) { acc.push({ path: pathStr, proto: `len ${a.length}`, port: `len ${b.length}` }); return acc; }
    a.forEach((x, i) => diff(x, b[i], `${pathStr}[${i}]`, acc));
    return acc;
  }
  if (JSON.stringify(a) !== JSON.stringify(b)) acc.push({ path: pathStr, proto: a, port: b });
  return acc;
}
