import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = resolve('node_modules/onnxruntime-web/dist');
await rm('public/ort', { recursive: true, force: true });
await mkdir('public/ort', { recursive: true });
for (const file of await readdir(source)) if (/^ort-wasm.*\.(wasm|mjs)$/.test(file)) await cp(resolve(source, file), resolve('public/ort', file));
console.log('Local WASM runtime copied. No network access.');

await cp('licenses', 'public/licenses', { recursive: true });
