'use strict';

/**
 * CineVeres Source 2 — controlled HLS resolver.
 *
 * This adapter talks only to a resolver/API that the site owner is authorized
 * to use. It does not scrape or bypass protected third-party sites.
 *
 * Expected resolver response:
 * {
 *   "sources": [
 *     {"url":"https://.../master.m3u8","quality":"1080p","label":"Server A"}
 *   ]
 * }
 *
 * Resolver URL:
 *   SOURCE2_RESOLVER_BASE=https://your-authorized-resolver.example
 *   SOURCE2_RESOLVER_PATH=/resolve
 */

const BASE = String(process.env.SOURCE2_RESOLVER_BASE || '').replace(/\/+$/, '');
const PATH = String(process.env.SOURCE2_RESOLVER_PATH || '/resolve');
const TIMEOUT = Math.max(5000, Number(process.env.SOURCE2_TIMEOUT_MS) || 25000);
const CACHE_TTL = Math.max(30000, Number(process.env.SOURCE2_CACHE_TTL_MS) || 300000);
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > CACHE_TTL) { cache.delete(key); return null; }
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { time: Date.now(), value });
  return value;
}

function resolution(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const m = String(value ?? '').match(/\b(2160|1440|1080|900|720|576|540|480|360|240)p?\b/i);
  return m ? Number(m[1]) : 0;
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeSource(item, index) {
  const url = String(item?.url || item?.link || item?.source || item?.streamUrl || '').trim();
  if (!/^https?:\/\//i.test(url)) return null;
  const q = resolution(item?.resolution ?? item?.quality ?? item?.label ?? item?.title);
  return {
    title: String(item?.title || item?.label || `Source 2 · ${q ? `${q}p` : `Server ${index + 1}`}`).trim(),
    url,
    quality: q ? `${q}p` : String(item?.quality || 'auto'),
    resolution: q,
    provider: String(item?.provider || item?.server || 'source2').trim() || 'source2',
    source: 'source2',
    sourceKind: /m3u8|mpegurl|hls/i.test(String(item?.type || item?.format || item?.mimeType || '')) || /m3u8/i.test(url) ? 'hls' : 'direct',
    subtitleUrl: String(item?.subtitleUrl || item?.subtitle_url || item?.subtitle || '').trim(),
    headers: item?.headers && typeof item.headers === 'object' ? item.headers : undefined,
  };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'CineVeres-Source2/1.0',
      },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Source 2 resolver HTTP ${response.status}: ${text.slice(0, 160)}`);
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function getSource2Streams(tmdbId, mediaType = 'movie', season = 1, episode = 1) {
  const id = String(tmdbId || '').replace(/\D/g, '');
  if (!id) return [];
  if (!BASE) {
    console.warn('[source2] SOURCE2_RESOLVER_BASE is not configured.');
    return [];
  }

  const type = mediaType === 'movie' ? 'movie' : 'tv';
  const se = Math.max(1, Number(season) || 1);
  const ep = Math.max(1, Number(episode) || 1);
  const key = `${type}:${id}:${se}:${ep}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    const u = new URL(PATH, `${BASE}/`);
    u.searchParams.set('tmdbId', id);
    u.searchParams.set('type', type);
    if (type !== 'movie') {
      u.searchParams.set('season', String(se));
      u.searchParams.set('episode', String(ep));
    }
    const data = await fetchJson(u.toString());
    const raw = firstArray(data?.sources, data?.streams, data?.data?.sources, data?.data?.streams);
    const seen = new Set();
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      const item = normalizeSource(raw[i], i);
      if (!item || seen.has(item.url)) continue;
      seen.add(item.url);
      out.push(item);
    }
    out.sort((a, b) => (b.resolution || 0) - (a.resolution || 0));
    cacheSet(key, out);
    if (!out.length) console.warn(`[source2] ${type} TMDB ${id}: resolver returned 0 sources.`);
    return out;
  } catch (error) {
    console.warn(`[source2] ${type} TMDB ${id}: ${error?.message || error}`);
    return [];
  }
}

module.exports = { getSource2Streams };
