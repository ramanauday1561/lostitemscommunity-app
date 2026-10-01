/**
 * A chainable fake of the Supabase client for unit-testing src/api/*.
 *
 * Every `from(table).select().eq()...` chain is recorded in `calls`, and awaiting
 * a chain resolves to the next response queued with `queue()` (default: empty
 * success). Nothing touches the network, and no real project is ever contacted.
 */
export interface Response { data?: unknown; error?: { message: string } | null; count?: number | null }
export interface Call { kind: 'from' | 'rpc' | 'storage' | 'auth'; name: string; ops: [string, unknown[]][] }

export class FakeSupabase {
  calls: Call[] = [];
  private responses: Response[] = [];

  /** Queue the response for the next awaited query / rpc / auth call. */
  queue(...rs: Response[]) { this.responses.push(...rs); return this; }
  reset() { this.calls = []; this.responses = []; }
  /** Ops recorded for the n-th call, as method names. */
  methods(n = 0) { return this.calls[n].ops.map(([m]) => m); }
  /** Args of the first `method` op recorded for the n-th call. */
  args(method: string, n = 0): unknown[] | undefined { return this.calls[n].ops.find(([m]) => m === method)?.[1]; }
  /** Every call that used `method` with exactly `args`, for asserting filters like .eq('status','live'). */
  has(method: string, ...args: unknown[]) {
    return this.calls.some((c) => c.ops.some(([m, a]) => m === method && JSON.stringify(a) === JSON.stringify(args)));
  }

  private next(): Response {
    const r = this.responses.shift() ?? {};
    return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
  }

  private chain(call: Call) {
    this.calls.push(call);
    const self = this;
    const proxy: any = new Proxy({}, {
      get(_t, prop: string) {
        if (prop === 'then') return (res: (v: Response) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(self.next()).then(res, rej);
        return (...args: unknown[]) => { call.ops.push([prop, args]); return proxy; };
      },
    });
    return proxy;
  }

  from = (table: string) => this.chain({ kind: 'from', name: table, ops: [] });
  rpc = (fn: string, args?: unknown) => this.chain({ kind: 'rpc', name: fn, ops: [['args', [args]]] });
  storage = { from: (bucket: string) => this.chain({ kind: 'storage', name: bucket, ops: [] }) };
  auth: any = new Proxy({}, {
    get: (_t, method: string) => async (...args: unknown[]) => {
      this.calls.push({ kind: 'auth', name: method, ops: [['args', args]] });
      return this.next();
    },
  });
}
