import * as ort from 'onnxruntime-web/wasm';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = resolve('public/ort') + '/';
const model = await readFile('public/models/Xenova/all-MiniLM-L6-v2/onnx/model_quantized.onnx');
const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] });
try {
 const feeds = {};
 for (const name of session.inputNames) {
  const data = name === 'input_ids' ? [101, 2023, 2003, 1037, 3231, 102] : name === 'attention_mask' ? [1, 1, 1, 1, 1, 1] : [0, 0, 0, 0, 0, 0];
  feeds[name] = new ort.Tensor('int64', BigInt64Array.from(data, BigInt), [1, 6]);
 }
 const outputs = await session.run(feeds); const tensor = Object.values(outputs)[0];
 const report = { checkedAt: new Date().toISOString(), backend: 'Real ONNX WASM executed in Node, one thread; not a browser test', inputs: session.inputNames, shape: tensor.dims, finite: Array.from(tensor.data).every(Number.isFinite), passed: tensor.dims.join(',') === '1,6,384' && Array.from(tensor.data).every(Number.isFinite) };
 await mkdir('evidence', { recursive: true }); await writeFile('evidence/wasm-smoke.json', JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report));
 if (!report.passed) process.exitCode = 1;
} finally { await session.release(); }
