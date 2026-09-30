(function () {
  const isLocalHost = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)$/i.test(location.hostname || '');
  const local = isLocalHost ? `http://${location.hostname}:8788` : '';

  // ضع رابط CineProxy العام هنا عند نشر الموقع على الإنترنت.
  // مثال: https://api.example.com
  const publicBackend = String(window.CINADAM_SOURCE2_PUBLIC_URL || '').trim();

  const sameOrigin = /^https?:$/i.test(location.protocol) ? location.origin : '';
  const bases = [local, publicBackend, sameOrigin]
    .map(v => String(v || '').trim().replace(/\/+$/, ''))
    .filter(Boolean);

  window.CINADAM_SOURCE2_CONFIG = {
    apiBases: Array.from(new Set(bases)),
    timeoutMs: 60000,
    preferredProvider: 'egybest',
    aiDescriptionEndpoint: ''
  };
  window.CINADAM_SOURCE2_URL = bases[0] || '';
})();
