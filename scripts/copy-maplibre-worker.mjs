// MapLibre runs its tile decoding in a separate worker module. The Metro web export only bundles the main file,
// so the worker (and the shared module it imports) is not in the build and the map silently stays empty.
// Copy both into public/maplibre/ (Expo serves public/ from the site root); MapPicker points MapLibre at them.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', 'maplibre-gl', 'dist');
const to = join(root, 'public', 'maplibre');

if (!existsSync(from)) process.exit(0); // maplibre-gl not installed (e.g. a production-only install)
mkdirSync(to, { recursive: true });
// Saved as .js, with the worker's import rewritten to match, so every host serves them as JavaScript (some static
// hosts send .mjs as a download type, and a module worker is refused).
const read = (name) => readFileSync(join(from, name), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '');
writeFileSync(join(to, 'maplibre-gl-shared.js'), read('maplibre-gl-shared.mjs'));
writeFileSync(join(to, 'maplibre-gl-worker.js'), read('maplibre-gl-worker.mjs').replaceAll('maplibre-gl-shared.mjs', 'maplibre-gl-shared.js'));
