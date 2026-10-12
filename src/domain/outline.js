function requireText(value, label) {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be text.`);
  }
}

function validateOutline(outline) {
  if (!outline || typeof outline !== 'object' || Array.isArray(outline)) {
    throw new TypeError('Choose a service outline before exporting.');
  }
  requireText(outline.title, 'Service title');
  requireText(outline.included, 'Included text');
  requireText(outline.confirmFirst, 'Text to confirm');
}

export function createOutline(service) {
  validateOutline(service);
  return {
    serviceId: service.id,
    title: service.title,
    included: service.included,
    confirmFirst: service.confirmFirst,
  };
}

function escapeMarkdownText(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+\-.!|~=:]/g, '\\$&');
}

export function buildOutlineMarkdown({ request, outline } = {}) {
  requireText(request, 'Request');
  validateOutline(outline);
  return [
    '# Scope Slip',
    '## Request',
    escapeMarkdownText(request),
    '## Service',
    escapeMarkdownText(outline.title),
    '## Included',
    escapeMarkdownText(outline.included) || 'No text supplied.',
    '## Confirm first',
    escapeMarkdownText(outline.confirmFirst) || 'No text supplied.',
    '## Review note',
    'Review and edit this draft before sharing or agreeing to the work.',
  ].join('\n\n') + '\n';
}
