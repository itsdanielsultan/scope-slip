import test from 'node:test';
import assert from 'node:assert/strict';
import { MatcherClient } from '../src/model/matcherClient.js';

// Transport doubles validate lifecycle, not AI/model execution or rankings.
class FakeWorker {
  static instances = [];
  constructor() { this.listeners = new Map(); this.messages = []; this.terminated = false; FakeWorker.instances.push(this); }
  addEventListener(type, fn) { this.listeners.set(type, fn); }
  postMessage(message) { this.messages.push(message); }
  terminate() { this.terminated = true; }
  reply(data) { this.listeners.get('message')?.({ data }); }
  error() { this.listeners.get('error')?.({}); }
}

function setup(t) {
  const previous = globalThis.Worker;
  FakeWorker.instances = [];
  globalThis.Worker = FakeWorker;
  const client = new MatcherClient();
  t.after(() => { client.dispose(); globalThis.Worker = previous; });
  return client;
}

test('initialization shares a single request and worker', async (t) => {
  const client = setup(t);
  const a = client.initialize();
  const b = client.initialize();
  assert.equal(a, b);
  assert.equal(FakeWorker.instances.length, 1);
  const worker = FakeWorker.instances[0];
  assert.equal(worker.messages.length, 1);
  worker.reply({ type: 'result', id: worker.messages[0].id, initialized: true });
  await a;
});

test('matching waits for initialization and preserves text only in worker messages', async (t) => {
  const client = setup(t);
  const job = client.match('Private fictional request');
  const worker = FakeWorker.instances[0];
  assert.deepEqual(worker.messages.map((message) => message.type), ['initialize']);
  worker.reply({ type: 'result', id: worker.messages[0].id, initialized: true });
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(worker.messages[1].text, 'Private fictional request');
  worker.reply({ type: 'result', id: worker.messages[1].id, results: [{ id: 'example', score: 0.4 }] });
  assert.equal((await job).results[0].id, 'example');
  assert.equal(client.pending.size, 0);
});

test('out-of-order responses resolve their own request and ignore unrelated messages', async (t) => {
  const client = setup(t);
  const a = client.request('match', 'A');
  const b = client.request('match', 'B');
  const worker = FakeWorker.instances[0];
  worker.reply(null);
  worker.reply({ type: 'not-a-result', id: 1 });
  worker.reply({ type: 'result', id: 999, results: [] });
  assert.equal(client.pending.size, 2);
  worker.reply({ type: 'result', id: worker.messages[1].id, value: 'B' });
  worker.reply({ type: 'result', id: worker.messages[0].id, value: 'A' });
  assert.equal((await a).value, 'A');
  assert.equal((await b).value, 'B');
});

test('status subscription can be removed', (t) => {
  const client = setup(t);
  client.ensureWorker();
  const phases = [];
  const unsubscribe = client.subscribe((phase) => phases.push(phase));
  const worker = FakeWorker.instances[0];
  worker.reply({ type: 'status', phase: 'loading' });
  unsubscribe();
  worker.reply({ type: 'status', phase: 'ready' });
  assert.deepEqual(phases, ['loading']);
});

test('model failure rejects pending work and a retry creates a fresh worker', async (t) => {
  const client = setup(t);
  const job = client.initialize();
  const rejected = assert.rejects(job, /MODEL_LOAD_FAILED/);
  const worker = FakeWorker.instances[0];
  worker.error();
  await rejected;
  assert.equal(worker.terminated, true);
  const retry = client.initialize();
  assert.equal(FakeWorker.instances.length, 2);
  const second = FakeWorker.instances[1];
  second.reply({ type: 'result', id: second.messages[0].id, initialized: true });
  await retry;
});

test('disposal rejects outstanding work, clears listeners and ignores late responses', async (t) => {
  const client = setup(t);
  const job = client.request('match', 'A');
  const rejected = assert.rejects(job, /DISPOSED/);
  const worker = FakeWorker.instances[0];
  client.dispose();
  worker.reply({ type: 'result', id: 1, value: 'late' });
  await rejected;
  assert.equal(client.pending.size, 0);
  assert.equal(client.listeners.size, 0);
  assert.equal(worker.terminated, true);
  assert.throws(() => client.ensureWorker(), /DISPOSED/);
});
