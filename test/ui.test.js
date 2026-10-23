import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { JSDOM } from 'jsdom';
import * as agent from '../src/agent.js';
const settle = () => new Promise(resolve => setImmediate(resolve));
test('DOM workflow: completion requires confirmation, undo restores, reset is clean', async () => {
 const dom = new JSDOM('<div id="app"></div>', { url: 'http://127.0.0.1:4318', runScripts: 'outside-only' });
 try {
  const w = dom.window; Object.assign(w, agent);
  w.testAI = { loadRouter: async () => async text => ({ intent: text.includes('Undo') ? 'undo' : 'complete', score: .9, tasks: { table: .8, lunch: .2 } }) };
  const source = (await readFile(new URL('../src/main.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '').replace("import('./semantic.js')", 'Promise.resolve(testAI)');
  new Script(source).runInContext(dom.getInternalVMContext()); const $ = s => w.document.querySelector(s);
  $('#message').value = 'I finished clearing the table'; $('#chat').dispatchEvent(new w.Event('submit', { cancelable: true })); await settle();
  assert.equal($('.task.done'), null); assert.match($('.action').textContent, /Confirm/);
  $('.action').click(); assert.equal(w.document.querySelectorAll('.task.done').length, 1); assert.equal($('#count').textContent, '1 / 6');
  assert.equal($('.action'), null);
  $('#message').value = 'Undo that'; $('#chat').dispatchEvent(new w.Event('submit', { cancelable: true })); await settle();
  $('.action').click(); assert.equal(w.document.querySelectorAll('.task.done').length, 0);
  $('#reset').click(); assert.equal($('#count').textContent, '0 / 6'); assert.equal(w.document.querySelectorAll('.message').length, 1);
 } finally { dom.window.close(); }
});
test('DOM treats user content as text and leaves state unchanged on model failure', async () => {
 const dom = new JSDOM('<div id="app"></div>', { url: 'http://127.0.0.1:4318', runScripts: 'outside-only' });
 try {
  const w = dom.window; Object.assign(w, agent); w.testAI = { loadRouter: async () => { throw new Error('No model'); } };
  const source = (await readFile(new URL('../src/main.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '').replace("import('./semantic.js')", 'Promise.resolve(testAI)');
  new Script(source).runInContext(dom.getInternalVMContext());
  w.document.querySelector('#message').value = '<img src=x onerror=alert(1)>';
  w.document.querySelector('#chat').dispatchEvent(new w.Event('submit', { cancelable: true })); await settle();
  assert.equal(w.document.querySelectorAll('img').length, 0); assert.equal(w.document.querySelectorAll('.task.done').length, 0);
  assert.match(w.document.querySelector('#messages').textContent, /could not complete/);
 } finally { dom.window.close(); }
});
