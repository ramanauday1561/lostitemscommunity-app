import fs from 'node:fs';
import path from 'node:path';

const PROTO = path.join(process.cwd(), 'prototype', 'Lost Items App v3 (native).dc.html');

/** Pulls the prototype's <script data-dc-script> block -- its real app logic. */
export function extractLogic() {
  const src = fs.readFileSync(PROTO, 'utf8');
  const m = src.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('could not find the dc script block in the prototype');
  return m[1];
}

/** Instantiates the prototype's Component with a trivial DCLogic stub. */
export function makeComponent() {
  class DCLogic {
    constructor(props) { this.props = props || {}; }
    setState(u, cb) {
      const patch = typeof u === 'function' ? u(this.state) : u;
      this.state = { ...this.state, ...patch };
      if (cb) cb();
    }
  }
  globalThis.document = globalThis.document || { querySelector: () => null };
  return new Function('DCLogic', extractLogic() + '\nreturn Component;')(DCLogic);
}
