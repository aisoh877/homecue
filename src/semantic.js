import { pipeline, env } from '@huggingface/transformers';
import { initialTasks, intentExamples } from './household.js';
env.allowLocalModels = true; env.allowRemoteModels = false; env.localModelPath = '/models/';
env.backends.onnx.wasm.wasmPaths = '/ort/'; env.backends.onnx.wasm.numThreads = 1;
let pending;
export async function loadRouter() {
 if (!pending) pending = (async () => {
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8', device: 'wasm' });
  const encode = async text => Array.from((await extractor(text, { pooling: 'mean', normalize: true })).data);
  return createRouter(encode);
 })().catch(error => { pending = null; throw error; });
 return pending;
}
export async function createRouter(encode) {
 const exemplars = [];
 for (const [intent, examples] of Object.entries(intentExamples)) for (const text of examples) exemplars.push({ intent, vector: await encode(text) });
 const taskVectors = {};
 for (const task of initialTasks) taskVectors[task.id] = await encode(`${task.title}. ${task.description}`);
 const similarity = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
 return async text => {
  const vector = await encode(text);
  const scores = exemplars.map(e => ({ intent: e.intent, score: similarity(vector, e.vector) })).sort((a, b) => b.score - a.score);
  return { ...scores[0], tasks: Object.fromEntries(Object.entries(taskVectors).map(([id, embedding]) => [id, similarity(vector, embedding)])) };
 };
}
