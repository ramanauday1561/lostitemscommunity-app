/// <reference types="node" />
/**
 * Import this FIRST in every API test file. It swaps src/lib/supabase (which pulls in
 * react-native-url-polyfill + AsyncStorage and needs real env vars) for a FakeSupabase,
 * so the data-access modules load under plain Node.
 */
import { createRequire } from 'node:module';
import { FakeSupabase } from './fakeSupabase';

export const fake = new FakeSupabase();

const nodeRequire = createRequire(__filename);
const target = nodeRequire.resolve('../../src/lib/supabase.ts');
nodeRequire.cache[target] = {
  id: target, filename: target, loaded: true, children: [], paths: [], exports: { supabase: fake },
} as unknown as NodeJS.Module;
