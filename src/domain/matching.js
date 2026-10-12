const REQUEST_CHARACTER_LIMIT = 800;

export function normalizeRequest(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Enter a request as text.');
  }

  const request = value.trim();
  if (!request) {
    throw new RangeError('Enter a request before matching services.');
  }
  if (Array.from(request).length > REQUEST_CHARACTER_LIMIT) {
    throw new RangeError(`Keep the request to ${REQUEST_CHARACTER_LIMIT} characters or fewer.`);
  }
  return request;
}

function validateVector(vector, label) {
  const isNumericContainer = Array.isArray(vector)
    || (ArrayBuffer.isView(vector) && !(vector instanceof DataView));
  if (!isNumericContainer || vector.length === 0) {
    throw new TypeError(`${label} must be a non-empty array or typed array of finite numbers.`);
  }
  for (let index = 0; index < vector.length; index += 1) {
    if (typeof vector[index] !== 'number' || !Number.isFinite(vector[index])) {
      throw new TypeError(`${label} must contain only finite numbers.`);
    }
  }
}

export function cosineSimilarity(a, b) {
  validateVector(a, 'First embedding');
  validateVector(b, 'Second embedding');
  if (a.length !== b.length) {
    throw new RangeError('Embedding dimensions must match.');
  }

  // Scaling first avoids overflow and underflow for otherwise valid vectors.
  let scaleA = 0;
  let scaleB = 0;
  for (let index = 0; index < a.length; index += 1) {
    scaleA = Math.max(scaleA, Math.abs(a[index]));
    scaleB = Math.max(scaleB, Math.abs(b[index]));
  }
  if (scaleA === 0 || scaleB === 0) return 0;

  let dot = 0;
  let squaredA = 0;
  let squaredB = 0;
  for (let index = 0; index < a.length; index += 1) {
    const componentA = a[index] / scaleA;
    const componentB = b[index] / scaleB;
    dot += componentA * componentB;
    squaredA += componentA * componentA;
    squaredB += componentB * componentB;
  }
  const score = dot / (Math.sqrt(squaredA) * Math.sqrt(squaredB));
  return Math.max(-1, Math.min(1, score));
}

export function rankServices(queryEmbedding, catalogEmbeddings, services, limit = 3) {
  validateVector(queryEmbedding, 'Request embedding');
  if (!Array.isArray(catalogEmbeddings) || !Array.isArray(services)) {
    throw new TypeError('Services and catalog embeddings must be arrays.');
  }
  if (catalogEmbeddings.length !== services.length) {
    throw new RangeError('Each service needs exactly one catalog embedding.');
  }
  if (!Number.isInteger(limit) || limit < 0) {
    throw new RangeError('The result limit must be a non-negative integer.');
  }

  const ranked = Array.from(services, (service, index) => {
    if (!service || typeof service !== 'object' || Array.isArray(service)) {
      throw new TypeError('Each service must be an object.');
    }
    return {
      service,
      index,
      score: cosineSimilarity(queryEmbedding, catalogEmbeddings[index]),
    };
  });

  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked.slice(0, limit).map(({ service, score }) => ({ ...service, score }));
}
