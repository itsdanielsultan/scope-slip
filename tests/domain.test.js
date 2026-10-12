import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRequest, cosineSimilarity, rankServices } from '../src/domain/matching.js';
import { createOutline, buildOutlineMarkdown } from '../src/domain/outline.js';

function approximately(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} differs from ${expected}`);
}

// These small vectors check the math; they are not evidence of model inference.
const services = Object.freeze([
  Object.freeze({ id: 'opposite', title: 'Opposite', included: 'One', confirmFirst: 'Time' }),
  Object.freeze({ id: 'parallel', title: 'Parallel', included: 'Two', confirmFirst: 'Place' }),
  Object.freeze({ id: 'diagonal', title: 'Diagonal', included: 'Three', confirmFirst: 'Format' }),
  Object.freeze({ id: 'orthogonal', title: 'Orthogonal', included: 'Four', confirmFirst: 'Size' }),
]);
const embeddings = Object.freeze([[-1, 0], [1, 0], [1, 1], [0, 1]]);

test('requests trim boundary whitespace while keeping interior text and newlines', () => {
  assert.equal(normalizeRequest(' \n First line\n  second line \t'), 'First line\n  second line');
});

test('request limits count Unicode code points rather than UTF-16 units', () => {
  const boundary = '🌿'.repeat(800);
  assert.equal(normalizeRequest(`  ${boundary}  `), boundary);
  assert.throws(() => normalizeRequest('🌿'.repeat(801)), RangeError);
  assert.throws(() => normalizeRequest('a'.repeat(801)), RangeError);
});

test('malformed and empty requests are rejected', () => {
  for (const value of [undefined, null, 42, {}, [], new String('request')]) {
    assert.throws(() => normalizeRequest(value), TypeError);
  }
  for (const value of ['', ' \n\t ', '\u00a0']) {
    assert.throws(() => normalizeRequest(value), RangeError);
  }
});

test('cosine satisfies parallel, opposite, orthogonal, symmetry and scale invariants', () => {
  approximately(cosineSimilarity([3, 4], [3, 4]), 1);
  approximately(cosineSimilarity([3, 4], [-3, -4]), -1);
  approximately(cosineSimilarity([1, 0], [0, 1]), 0);
  const a = [2, -3, 4];
  const b = [-1, 5, 2];
  approximately(cosineSimilarity(a, b), cosineSimilarity(b, a));
  approximately(cosineSimilarity(a, b), cosineSimilarity(a.map((x) => x * 7), b));
});

test('finite typed arrays work and neither input is changed', () => {
  const a = new Float32Array([3, 4]);
  const b = new Float64Array([6, 8]);
  approximately(cosineSimilarity(a, b), 1);
  assert.deepEqual(Array.from(a), [3, 4]);
  assert.deepEqual(Array.from(b), [6, 8]);
});

test('zero vectors return zero, including when both vectors are zero', () => {
  assert.equal(cosineSimilarity([0, 0], [1, 2]), 0);
  assert.equal(cosineSimilarity([1, 2], [0, 0]), 0);
  assert.equal(cosineSimilarity([0, 0], [0, 0]), 0);
});

test('valid extreme finite vectors avoid overflow and underflow', () => {
  approximately(cosineSimilarity([1e308, 1e308], [1e308, 1e308]), 1);
  approximately(cosineSimilarity([Number.MIN_VALUE], [-Number.MIN_VALUE]), -1);
});

test('invalid vector containers, entries and dimensions are rejected', () => {
  for (const vector of [[], '1', {}, null, [NaN], [Infinity], ['1'], [undefined], Array(1), new BigInt64Array([1n]), new DataView(new ArrayBuffer(8))]) {
    assert.throws(() => cosineSimilarity(vector, [1]), TypeError);
  }
  assert.throws(() => cosineSimilarity([1], [1, 2]), RangeError);
  assert.throws(() => cosineSimilarity([0], [0, 0]), RangeError);
});

test('ranking uses cosine order, preserves service fields and defaults to three', () => {
  const ranked = rankServices([1, 0], embeddings, services);
  assert.deepEqual(ranked.map((service) => service.id), ['parallel', 'diagonal', 'orthogonal']);
  approximately(ranked[0].score, 1);
  approximately(ranked[1].score, Math.SQRT1_2);
  assert.equal(ranked[0].included, 'Two');
  assert.equal(ranked[0].included, services[1].included);
  assert.deepEqual(Object.keys(ranked[0]).sort(), ['confirmFirst', 'id', 'included', 'score', 'title']);
  assert.equal(services[0].id, 'opposite');
  assert.ok(!Object.hasOwn(services[1], 'score'));
});

test('ties keep catalog order, including a zero request vector', () => {
  assert.deepEqual(rankServices([0, 0], embeddings, services, 4).map((x) => x.id), services.map((x) => x.id));
  assert.deepEqual(rankServices([1, 0], [[1, 0], [2, 0]], services.slice(0, 2), 2).map((x) => x.id), ['opposite', 'parallel']);
});

test('ranking applies an explicit limit and accepts an empty catalog', () => {
  assert.equal(rankServices([1, 0], embeddings, services, 1).length, 1);
  assert.deepEqual(rankServices([1, 0], embeddings, services, 0), []);
  assert.deepEqual(rankServices([1, 0], [], []), []);
});

test('ranking rejects invalid alignment and dimensions even outside the result limit', () => {
  assert.throws(() => rankServices([1, 0], embeddings.slice(1), services), RangeError);
  assert.throws(() => rankServices([1, 0], [[1, 0], [1]], services.slice(0, 2), 1), RangeError);
  assert.throws(() => rankServices([1, 0], [[1, 0], [NaN, 0]], services.slice(0, 2), 0), TypeError);
  assert.throws(() => rankServices([1, 0], [[1, 0]], [null]), TypeError);
  assert.throws(() => rankServices([1, 0], [[1, 0]], Array(1)), TypeError);
  assert.throws(() => rankServices([1, 0], null, services), TypeError);
  for (const limit of [-1, 0.5, NaN, Infinity, '3']) {
    assert.throws(() => rankServices([1, 0], embeddings, services, limit), RangeError);
  }
});

test('creating an outline keeps the selected service fields without internal scores', () => {
  const service = { ...services[1], score: 0.8, extra: 'internal' };
  assert.deepEqual(createOutline(service), {
    serviceId: 'parallel', title: 'Parallel', included: 'Two', confirmFirst: 'Place',
  });
});

test('export uses the edited outline and keeps request and item newlines', () => {
  const outline = createOutline(services[1]);
  const edited = { ...outline, title: 'Edited title', included: 'Edited first\ncontinued detail', confirmFirst: 'Edited question' };
  const markdown = buildOutlineMarkdown({ request: 'First line\r\nSecond line', outline: edited });
  assert.ok(markdown.startsWith('# Scope Slip\n\n## Request\n\nFirst line\nSecond line'));
  assert.ok(markdown.includes('## Service\n\nEdited title'));
  assert.ok(markdown.includes('Edited first\ncontinued detail'));
  assert.ok(markdown.includes('## Confirm first\n\nEdited question'));
  assert.ok(markdown.includes('## Review note'));
  assert.ok(!markdown.includes('Parallel'));
  assert.ok(!markdown.includes('serviceId'));
});

test('export escapes HTML, Markdown links, headings, fences and supplied entities', () => {
  const request = '<script>alert(1)</script>\n[run](javascript:alert(1))\n# heading\n```html\n<img src=x onerror=alert(1)>\n```\n&lt;script&gt;';
  const markdown = buildOutlineMarkdown({
    request,
    outline: { title: '[title](javascript:alert(2))', included: '**bold**\none\n---\n<script>bad</script>', confirmFirst: '![image](javascript:alert(3))' },
  });
  assert.ok(markdown.includes('&lt;script&gt;alert\\(1\\)&lt;/script&gt;'));
  assert.ok(markdown.includes('\\[run\\]\\(javascript\\:alert\\(1\\)\\)'));
  assert.ok(markdown.includes('\\# heading'));
  assert.ok(markdown.includes('\\`\\`\\`html'));
  assert.ok(markdown.includes('&amp;lt;script&amp;gt;'));
  assert.ok(markdown.includes('\\-\\-\\-\n&lt;script&gt;bad&lt;/script&gt;'));
  assert.doesNotMatch(markdown, /<\/?(?:script|img)\b/i);
  assert.doesNotMatch(markdown, /\]\(javascript:/i);
  assert.equal((markdown.match(/^# /gm) || []).length, 1);
});

test('empty text exports explicitly and malformed outlines fail', () => {
  const outline = { title: 'A service', included: '', confirmFirst: '' };
  assert.equal((buildOutlineMarkdown({ request: 'Text', outline }).match(/No text supplied\./g) || []).length, 2);
  assert.throws(() => createOutline(null), TypeError);
  assert.throws(() => buildOutlineMarkdown({ request: 42, outline }), TypeError);
  assert.throws(() => buildOutlineMarkdown({ request: 'Text', outline: { ...outline, included: [42] } }), TypeError);
  assert.throws(() => buildOutlineMarkdown({ request: 'Text', outline: { ...outline, confirmFirst: ['question'] } }), TypeError);
});
