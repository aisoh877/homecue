import { pipeline, env } from '@huggingface/transformers';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRouter } from '../src/semantic.js';
import { createState, interpret, confirmCompletion, undoLast } from '../src/agent.js';
import { intentExamples } from '../src/household.js';
env.allowRemoteModels = false; env.localModelPath = resolve('public/models') + '/'; env.cacheDir = resolve('.cache');
const start = performance.now();
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8', device: 'cpu', session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 } });
const encode = async text => Array.from((await extractor(text, { pooling: 'mean', normalize: true })).data);
const route = await createRouter(encode);
const cases = [
 ['Plan a ten minute reset in the kitchen', 'plan'],
 ['What is left for me to do?', 'handoff'],
 ['I finished clearing the table', 'complete'],
 ['Undo the last change', 'undo'],
 ['Send a message to Jamie', 'unsupported'],
 ['The towels are folded now', 'complete'],
 ['I only have five minutes for chores', 'plan'],
 ['Buy some milk for me', 'unsupported']
];
const results = [];
for (const [text, expected] of cases) { const prediction = await route(text); results.push({ text, expected, usedAsIntentExample: Object.values(intentExamples).flat().includes(text), intent: prediction.intent, score: prediction.score, passed: prediction.intent === expected }); }
const state = createState();
const plan = interpret(state, cases[0][0], await route(cases[0][0]));
const completion = interpret(state, cases[2][0], await route(cases[2][0]));
const proposalPassed = completion.proposal?.taskId === 'table' && state.tasks[0].status === 'open';
if (proposalPassed) { confirmCompletion(state); undoLast(state); }
const workflow = { planWithinTenMinutes: plan.tasks?.reduce((a, t) => a + t.minutes, 0) <= 10, confirmedCorrectTask: proposalPassed, restored: state.tasks[0].status === 'open' };
const report = { checkedAt: new Date().toISOString(), inference: 'real local ONNX q8 / CPU / one thread / remote models disabled', milliseconds: Math.round(performance.now() - start), passed: results.filter(r => r.passed).length, total: results.length, limitation: 'Eight authored intent smoke cases; not a general conversational accuracy benchmark. Alexa and browser WASM not verified by this test.', results, workflow };
await mkdir('evidence', { recursive: true }); await writeFile('evidence/model-evaluation.json', JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2));
if (results.some(r => !r.passed) || Object.values(workflow).some(v => !v)) process.exitCode = 1;
