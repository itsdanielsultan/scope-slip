let sharedClient;

export class MatcherClient {
  constructor() {
    this.worker = undefined;
    this.pending = new Map();
    this.listeners = new Set();
    this.nextId = 0;
    this.initialization = undefined;
    this.disposed = false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  ensureWorker() {
    if (this.disposed) throw new Error('DISPOSED');
    if (this.worker) return;
    this.worker = new Worker(new URL('./embedding.worker.js', import.meta.url), { type: 'module' });
    this.worker.addEventListener('message', ({ data }) => {
      if (this.disposed) return;
      if (!data || typeof data !== 'object' || !['status', 'result', 'error'].includes(data.type)) return;
      if (data.type === 'status') {
        this.listeners.forEach((listener) => listener(data.phase));
        return;
      }
      const job = this.pending.get(data.id);
      if (!job) return;
      clearTimeout(job.timer);
      this.pending.delete(data.id);
      if (data.type === 'error') job.reject(new Error(data.code));
      else job.resolve(data);
    });
    this.worker.addEventListener('error', () => this.fail('MODEL_LOAD_FAILED'));
    this.worker.addEventListener('messageerror', () => this.fail('MATCH_FAILED'));
  }

  fail(code) {
    this.pending.forEach((job) => {
      clearTimeout(job.timer);
      job.reject(new Error(code));
    });
    this.pending.clear();
    this.worker?.terminate();
    this.worker = undefined;
    this.initialization = undefined;
    if (!this.disposed) this.listeners.forEach((listener) => listener('error'));
  }

  request(type, text) {
    this.ensureWorker();
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(type === 'initialize' ? 'MODEL_LOAD_FAILED' : 'MATCH_FAILED'), type === 'initialize' ? 300000 : 60000);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type, ...(type === 'match' ? { text } : {}) });
    });
  }

  initialize() {
    if (!this.initialization) {
      this.initialization = this.request('initialize').catch((error) => {
        this.initialization = undefined;
        throw error;
      });
    }
    return this.initialization;
  }

  async match(text) {
    await this.initialize();
    return this.request('match', text);
  }

  dispose() {
    this.disposed = true;
    this.worker?.postMessage({ type: 'dispose' });
    this.fail('DISPOSED');
    this.listeners.clear();
  }
}

export function getMatcherClient() {
  if (!sharedClient || sharedClient.disposed) sharedClient = new MatcherClient();
  return sharedClient;
}

if (import.meta.hot) import.meta.hot.dispose(() => sharedClient?.dispose());
