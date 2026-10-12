import { SERVICES } from '../data/services.js';
import { normalizeRequest, rankServices } from '../domain/matching.js';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const REVISION = '751bff37182d3f1213fa05d7196b954e230abad9';
let modelPromise;
let extractor;
let catalogVectors;
let queue = Promise.resolve();
let disposed = false;

function notify(phase) {
  self.postMessage({ type: 'status', phase });
}

async function initialize() {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    notify('loading');
    // Heavy AI runtime is isolated in this feature's dedicated module worker.
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.useBrowserCache = true; // Weight/runtime assets only, never requests.
    env.useFSCache = false;
    env.backends.onnx.wasm.numThreads = 1;
    env.backends.onnx.wasm.proxy = false;
    extractor = await pipeline('feature-extraction', MODEL_ID, {
      revision: REVISION,
      dtype: 'q8',
      device: 'wasm',
    });
    if (disposed) {
      await extractor.dispose();
      throw new Error('DISPOSED');
    }
    notify('catalog');
    const embeddings = await extractor(SERVICES.map((service) => service.semanticText), {
      pooling: 'mean', normalize: true,
    });
    catalogVectors = embeddings.tolist();
    notify('ready');
  })().catch(async (error) => {
    modelPromise = undefined;
    if (extractor) await extractor.dispose().catch(() => {});
    extractor = undefined;
    catalogVectors = undefined;
    throw error;
  });
  return modelPromise;
}

async function perform(message) {
  if (disposed) return;
  const { id, type } = message;
  if (!Number.isSafeInteger(id) || id < 1) return;
  try {
    if (type === 'initialize') {
      await initialize();
      self.postMessage({ type: 'result', id, initialized: true });
      return;
    }
    if (type !== 'match') return;
    const text = normalizeRequest(message.text);
    await initialize();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const results = rankServices(Array.from(output.data), catalogVectors, SERVICES, 3);
    if (!disposed) self.postMessage({ type: 'result', id, results });
  } catch {
    // Do not serialize private request text, a model's raw error, or a stack.
    const code = extractor && catalogVectors ? 'MATCH_FAILED' : 'MODEL_LOAD_FAILED';
    if (!disposed) self.postMessage({ type: 'error', id, code });
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'dispose') {
    disposed = true;
    queue = queue.then(async () => {
      if (extractor) await extractor.dispose();
      extractor = undefined;
      catalogVectors = undefined;
      self.close();
    });
    return;
  }
  // ONNX calls are serialized. The UI independently rejects superseded results.
  queue = queue.then(() => perform(event.data ?? {})).catch(() => {});
});
