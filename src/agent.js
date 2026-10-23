import { initialTasks } from './household.js';
export const createState = () => ({ version: 1, tasks: structuredClone(initialTasks), revision: 0, history: [], pending: null });
export function restoreState(raw) {
 try {
  const saved = JSON.parse(raw);
  if (saved?.version !== 1 || !Number.isSafeInteger(saved.revision) || saved.revision < 0 || !Array.isArray(saved.tasks) || saved.tasks.length !== initialTasks.length) return createState();
  const ids = new Set(saved.tasks.map(t => t.id));
  if (ids.size !== initialTasks.length) return createState();
  const state = createState();
  for (const task of state.tasks) { const source = saved.tasks.find(t => t.id === task.id); if (!source || !['open', 'done'].includes(source.status)) return createState(); task.status = source.status; }
  state.revision = saved.revision;
  // Persist statuses only. Old proposals and undo histories never regain authority after a reload.
  return state;
 } catch { return createState(); }
}
export function planTasks(state, minutes, affinities = {}) {
 if (!Number.isInteger(minutes) || minutes < 3 || minutes > 30) throw new Error('Choose 3–30 minutes.');
 const available = state.tasks.filter(t => t.status === 'open' && ['you', 'anyone'].includes(t.owner));
 let best = [], bestScore = -1;
 for (let mask = 1; mask < (1 << available.length); mask++) {
  const chosen = available.filter((_, i) => mask & (1 << i));
  if (chosen.reduce((total, t) => total + t.minutes, 0) > minutes) continue;
  const score = chosen.reduce((total, t) => total + t.priority + Math.max(0, affinities[t.id] || 0) * 4, 0);
  if (score > bestScore) { bestScore = score; best = chosen; }
 }
 return best;
}
export function proposeCompletion(state, taskId) {
 const task = state.tasks.find(t => t.id === taskId);
 if (!task || task.status === 'done') throw new Error('That task is not open.');
 if (!['you', 'anyone'].includes(task.owner)) throw new Error('That belongs to Jamie. Leave it unchanged and ask them directly.');
 state.pending = { taskId, revision: state.revision };
 return { ...state.pending, title: task.title };
}
export function confirmCompletion(state) {
 const p = state.pending;
 if (!p || p.revision !== state.revision) throw new Error('That proposal is no longer current. Ask again.');
 const task = state.tasks.find(t => t.id === p.taskId);
 if (!task || task.status !== 'open' || !['you', 'anyone'].includes(task.owner)) throw new Error('Task changed. Ask again.');
 task.status = 'done'; state.revision++;
 state.history.push({ taskId: task.id, before: 'open', after: 'done', revision: state.revision }); state.pending = null;
 return task;
}
export function undoLast(state) {
 const last = state.history.at(-1);
 if (!last) throw new Error('There is no change to undo in this session.');
 const task = state.tasks.find(t => t.id === last.taskId);
 if (!task || task.status !== last.after || last.revision !== state.revision) throw new Error('A newer change prevents this undo.');
 task.status = last.before; state.history.pop(); state.revision++; state.pending = null;
 if (state.history.length) state.history.at(-1).revision = state.revision;
 return task;
}
export function extractMinutes(text) {
 const number = text.match(/\b(\d{1,3})\s*(?:minute|min|minutes|mins)\b/i);
 if (number) return Number(number[1]);
 const words = { three: 3, five: 5, ten: 10, fifteen: 15, twenty: 20, thirty: 30 };
 const match = text.toLowerCase().match(/\b(three|five|ten|fifteen|twenty|thirty)\s+minutes?\b/);
 return match ? words[match[1]] : 10;
}
export function interpret(state, text, prediction) {
 if (typeof text !== 'string' || !text.trim() || text.length > 240) throw new Error('Use 1–240 characters.');
 state.pending = null;
 const trace = [{ tool: 'local_semantic_router', detail: prediction.intent, score: Number(prediction.score.toFixed(3)) }];
 if (prediction.intent === 'complete' && /\b(?:not|never|haven't|hasn't|didn't|don't|isn't|aren't|wasn't)\b/i.test(text)) return { message: 'I heard a correction or something unfinished. I will leave the tasks unchanged. Tell me the task only when you want to record it as complete.', trace };
 if (prediction.score < 0.3 || prediction.intent === 'unsupported') return { message: 'I can plan household tasks, show a handoff, or draft a completion for you to confirm. I cannot operate devices, buy things or contact anyone.', trace };
 if (prediction.intent === 'plan') {
  const minutes = extractMinutes(text); const tasks = planTasks(state, minutes, prediction.tasks);
  trace.push({ tool: 'plan_tasks', detail: `${minutes} minute budget; excludes Jamie’s tasks and completed tasks` });
  return { message: tasks.length ? `Here is a ${tasks.reduce((sum, t) => sum + t.minutes, 0)} minute reset. Start with ${tasks[0].title.toLowerCase()}. Nothing has been marked done.` : 'No open task fits that time. Take a pause, or ask for a longer window.', tasks, trace };
 }
 if (prediction.intent === 'complete') {
  const sorted = state.tasks.map(t => ({ ...t, score: prediction.tasks[t.id] || 0 })).sort((a, b) => b.score - a.score);
  if (sorted[0].score < 0.32 || sorted[0].score - sorted[1].score < 0.06) return { message: 'Which task did you finish? Please name it, such as “I finished clearing the table.” Nothing has changed.', trace };
  const proposal = proposeCompletion(state, sorted[0].id); trace.push({ tool: 'propose_completion', detail: proposal.taskId });
  return { message: `Mark “${proposal.title}” done? Confirm below to update this demo household.`, proposal, trace };
 }
 if (prediction.intent === 'undo') {
  // The conversation offers an explicit Undo button; text alone never commits a mutation.
  return { message: state.history.length ? 'You can restore the most recent completion with Undo below.' : 'No completion to undo in this session.', undo: state.history.length > 0, trace };
 }
 const open = state.tasks.filter(t => t.status === 'open'); const yours = open.filter(t => ['you', 'anyone'].includes(t.owner));
 trace.push({ tool: 'read_handoff', detail: `${yours.length} available; ${open.length - yours.length} assigned to Jamie` });
 return { message: `${yours.length} tasks are available to you. ${open.length - yours.length} belong to Jamie. ${state.tasks.length - open.length} are marked done. Ask for a short reset when you’re ready.`, tasks: yours, trace };
}
