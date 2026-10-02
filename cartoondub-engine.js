/*
 * CartoonDub web adapter
 * Source-derived from the CartoonDub CloudStream provider in cs-cinemana.
 * The browser talks only to the Cinemana proxy; the proxy talks to the
 * CartoonDub cards API and optionally proxies the final R2 MP4 for playback.
 */
(function () {
  'use strict';

  const DEFAULT_PUBLIC_PROXY = 'https://api.cinadam.xyz';
  const DEFAULT_LOCAL_PROXY = 'http://localhost:8787';

  const getProxyCandidates = () => {
    const out = [];
    const add = (v) => {
      const s = String(v || '').trim().replace(/\/$/, '');
      if (s && !out.includes(s)) out.push(s);
    };
    const explicit = (typeof window !== 'undefined' && (
      window.CARTOONDUB_PROXY_URL ||
      window.CINEMANA_PROXY_URL ||
      window.CINEMANA_PROXY
    )) || '';
    add(explicit);

    try {
      const host = String(location.hostname || '').toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      const isLan = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host);
      if (isLocal || isLan) add(`http://${host}:8787`);
      else if (!host) add(DEFAULT_LOCAL_PROXY);
    } catch (_) {}

    add(DEFAULT_PUBLIC_PROXY);
    return out;
  };

  const getProxyBase = () => getProxyCandidates()[0] || DEFAULT_PUBLIC_PROXY;

  const timeoutFetch = async (url, options = {}, timeoutMs = 25000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const proxyJson = async (path, params) => {
    const usp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') usp.set(k, String(v));
    });
    let last = null;
    for (const base of getProxyCandidates()) {
      const url = `${base}${path}${usp.toString() ? `?${usp}` : ''}`;
      try {
        const r = await timeoutFetch(url, { headers: { Accept: 'application/json' } }, 30000);
        let data = null;
        try { data = await r.json(); } catch (_) {}
        if (r.ok && data && data.ok !== false) return data;
        last = new Error((data && data.error) || `CartoonDub proxy HTTP ${r.status}`);
      } catch (e) { last = e; }
    }
    throw last || new Error('تعذر الاتصال ببروكسي CartoonDub');
  };

  const normalizeSource = (s) => {
    if (!s || !s.url) return null;
    const direct = String(s.url).trim();
    if (!/^https?:\/\//i.test(direct)) return null;
    return {
      url: direct,
      provider: 'cartoondub',
      name: s.name || 'CartoonDub',
      label: s.label || 'MP4',
      quality: s.quality ?? s.resolution ?? '',
      resolution: Number(s.resolution) || 0,
      type: 'mp4',
      subtitleUrl: s.subtitleUrl || '',
    };
  };

  const viaProxy = (rawUrl) => {
    const base = getProxyBase();
    return `${base}/cartoondub/proxy?url=${encodeURIComponent(String(rawUrl || ''))}`;
  };

  async function resolveMovie(meta = {}) {
    const data = await proxyJson('/cartoondub/resolve/movie', {
      title: meta.name || meta.title || meta.originalTitle || '',
      originalTitle: meta.originalTitle || meta.original_name || '',
      year: meta.year || meta.releaseYear || '',
      tmdb: meta.tmdbId || meta.tmdb || '',
      cartoondubId: meta.cartoondubId || '',
      sectionId: meta.cartoondubSectionId || meta.sectionId || '',
      target: meta.cartoondubTarget || meta.target || '',
    });
    const sources = (data.sources || []).map(normalizeSource).filter(Boolean).map(s => ({
      ...s,
      rawUrl: s.url,
      url: viaProxy(s.url),
    }));
    if (!sources.length) throw new Error(data.error || 'CartoonDub لم يرجّع رابط تشغيل');
    return {
      ...data,
      sources,
      url: sources[0].url,
      provider: 'cartoondub',
    };
  }

  async function resolveEpisode(meta = {}, seasonNumber = 1, episodeNumber = 1) {
    const data = await proxyJson('/cartoondub/resolve/episode', {
      title: meta.name || meta.title || meta.seriesTitle || meta.originalTitle || '',
      originalTitle: meta.originalTitle || meta.original_name || '',
      year: meta.year || '',
      tmdb: meta.tmdbId || meta.tmdb || '',
      season: Number(seasonNumber) || 1,
      episode: Number(episodeNumber) || 1,
      cartoondubId: meta.cartoondubId || '',
      sectionId: meta.cartoondubSectionId || meta.sectionId || '',
      target: meta.cartoondubTarget || meta.target || '',
    });
    const sources = (data.sources || []).map(normalizeSource).filter(Boolean).map(s => ({
      ...s,
      rawUrl: s.url,
      url: viaProxy(s.url),
    }));
    if (!sources.length) throw new Error(data.error || 'CartoonDub لم يرجّع رابط تشغيل للحلقة');
    return {
      ...data,
      sources,
      url: sources[0].url,
      provider: 'cartoondub',
    };
  }

  async function health() {
    return proxyJson('/cartoondub/health', {});
  }

  function isCartoonDubUrl(url) {
    const s = String(url || '');
    return /\/cartoondub\/proxy(?:[/?#]|$)/i.test(s) || /pub-b534f19ddae84293ae0e0fb360695fcf\.r2\.dev/i.test(s);
  }

  window.CartoonDubEngine = {
    getProxyBase,
    resolveMovie,
    resolveEpisode,
    health,
    isCartoonDubUrl,
    viaProxy,
  };
})();
