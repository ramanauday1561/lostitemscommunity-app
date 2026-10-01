/** Resolves once `cond()` is true (polling), instead of sleeping a fixed time that a busy machine can miss. */
export async function waitFor(cond: () => boolean, what = 'condition', timeoutMs = 3000): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 5));
  }
}
