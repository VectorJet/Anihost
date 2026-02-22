const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const RESPONSE_HEADER_ALLOWLIST = [
  'content-type',
  'content-disposition',
  'accept-ranges',
  'content-range',
  'etag',
  'last-modified',
  'cache-control',
  'expires',
];

const memoryCache = new Map();

function parseIntEnv(name, fallback) {
  const raw = process.env[name];
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const PROXY_TIMEOUT_MS = parseIntEnv('PROXY_TIMEOUT_MS', 20_000);
const PROXY_CACHE_MAX_ITEMS = parseIntEnv('PROXY_CACHE_MAX_ITEMS', 150);
const PROXY_PLAYLIST_TTL_MS = parseIntEnv('PROXY_PLAYLIST_TTL_MS', 15_000);
const PROXY_ASSET_TTL_MS = parseIntEnv('PROXY_ASSET_TTL_MS', 60_000);
const PROXY_MAX_CACHEABLE_BYTES = parseIntEnv('PROXY_MAX_CACHEABLE_BYTES', 1_000_000);

class ProxyError extends Error {
  constructor(message, status = 500, noFallback = false) {
    super(message);
    this.status = status;
    this.noFallback = noFallback;
  }
}

function getAllowedProxyHosts() {
  return (process.env.PROXY_ALLOWED_HOSTS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isPrivateIPv4(hostname) {
  const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 0) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;

  return false;
}

function isPrivateIPv6(hostname) {
  const lowered = hostname.toLowerCase();

  return (
    lowered === '::1' ||
    lowered.startsWith('fe80:') ||
    lowered.startsWith('fc') ||
    lowered.startsWith('fd') ||
    lowered.startsWith('::ffff:127.')
  );
}

function isPrivateHost(hostname) {
  const lowered = hostname.toLowerCase();

  if (
    lowered === 'localhost' ||
    lowered.endsWith('.localhost') ||
    lowered.endsWith('.local') ||
    lowered === '0.0.0.0'
  ) {
    return true;
  }

  if (isPrivateIPv4(lowered) || isPrivateIPv6(lowered)) {
    return true;
  }

  return false;
}

function validateTargetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new ProxyError('Missing url query parameter', 400, true);
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ProxyError('Invalid url query parameter', 400, true);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ProxyError('Only http and https protocols are supported', 400, true);
  }

  if (isPrivateHost(parsed.hostname)) {
    throw new ProxyError('Proxy target host is not allowed', 403, true);
  }

  const allowedHosts = getAllowedProxyHosts();
  if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname.toLowerCase())) {
    throw new ProxyError('Target host is not allowlisted', 403, true);
  }

  return parsed;
}

function normalizeReferer(rawReferer) {
  if (!rawReferer || !rawReferer.trim()) return '';

  try {
    const parsed = new URL(rawReferer);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('invalid protocol');
    }
    return parsed.toString();
  } catch {
    throw new ProxyError('Invalid referer query parameter', 400, true);
  }
}

function createCacheKey(targetUrl, referer, range) {
  return `${targetUrl}|${referer}|${range || ''}`;
}

function readMemoryCache(cacheKey) {
  const cached = memoryCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() >= cached.expiresAt) {
    memoryCache.delete(cacheKey);
    return null;
  }

  const headers = new Headers(cached.headers);
  headers.set('x-proxy-cache', 'HIT');

  return new Response(cached.body.slice(0), {
    status: cached.status,
    statusText: cached.statusText,
    headers,
  });
}

function writeMemoryCache(cacheKey, responsePayload, ttlMs) {
  if (memoryCache.size >= PROXY_CACHE_MAX_ITEMS) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) {
      memoryCache.delete(firstKey);
    }
  }

  memoryCache.set(cacheKey, {
    ...responsePayload,
    expiresAt: Date.now() + ttlMs,
  });
}

function shouldTreatAsPlaylist(targetUrl, contentType) {
  const normalized = targetUrl.toLowerCase();
  return (
    contentType.includes('mpegurl') ||
    contentType.includes('application/vnd.apple.mpegurl') ||
    normalized.endsWith('.m3u8') ||
    normalized.endsWith('.m3u')
  );
}

function buildProxyUrl(requestUrlObj, absoluteTargetUrl, referer) {
  const base = `${requestUrlObj.origin}${requestUrlObj.pathname}`;
  const params = new URLSearchParams();
  params.set('url', absoluteTargetUrl);
  if (referer) {
    params.set('referer', referer);
  }
  return `${base}?${params.toString()}`;
}

function rewritePlaylist(playlistText, sourceUrl, requestUrlObj, referer) {
  const rewriteTarget = (target) => {
    if (!target || !target.trim()) return target;
    try {
      const resolved = new URL(target.trim(), sourceUrl).toString();
      return buildProxyUrl(requestUrlObj, resolved, referer);
    } catch {
      return target;
    }
  };

  const lines = playlistText.split('\n');
  const rewritten = lines.map((line) => {
    const withUriAttributes = line.replace(/URI="([^"]+)"/g, (_match, value) => {
      return `URI="${rewriteTarget(value)}"`;
    });

    const trimmed = withUriAttributes.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return withUriAttributes;
    }

    return rewriteTarget(trimmed);
  });

  return rewritten.join('\n');
}

function selectResponseHeaders(upstreamHeaders, { isPlaylist, bodySize }) {
  const headers = new Headers();

  for (const headerName of RESPONSE_HEADER_ALLOWLIST) {
    const value = upstreamHeaders.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  if (isPlaylist) {
    headers.set('content-type', 'application/vnd.apple.mpegurl');
    headers.delete('content-length');
  } else if (Number.isFinite(bodySize)) {
    headers.set('content-length', String(bodySize));
  }

  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, OPTIONS');
  headers.set('access-control-allow-headers', '*');
  headers.set('x-proxy-cache', 'MISS');

  return headers;
}

async function fetchWithTimeout(targetUrl, headers) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    return await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ProxyError(`Upstream request timeout after ${PROXY_TIMEOUT_MS}ms`, 504);
    }
    throw new ProxyError(`Failed to fetch upstream resource: ${error.message}`, 502);
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildUpstreamHeaders(targetUrlObj, referer, incomingHeaders) {
  const headers = new Headers();
  headers.set('user-agent', incomingHeaders['user-agent'] || DEFAULT_USER_AGENT);
  headers.set('accept', '*/*');
  headers.set('accept-language', incomingHeaders['accept-language'] || 'en-US,en;q=0.9');

  const range = incomingHeaders['range'];
  if (range) {
    headers.set('range', range);
  }

  if (referer) {
    headers.set('referer', referer);
    headers.set('origin', new URL(referer).origin);
  } else {
    const targetOrigin = `${targetUrlObj.protocol}//${targetUrlObj.host}`;
    headers.set('referer', `${targetOrigin}/`);
    headers.set('origin', targetOrigin);
  }

  return headers;
}

function makeErrorResponse(c, error) {
  const status = error?.status || 500;
  const message = error?.message || 'Failed to proxy request';
  return c.json(
    {
      error: 'Failed to proxy request',
      details: message,
    },
    status
  );
}

async function hardenedProxy(c, rawUrl, rawReferer) {
  const targetUrlObj = validateTargetUrl(rawUrl);
  const referer = normalizeReferer(rawReferer);
  const incomingHeaders = c.req.header();
  const range = incomingHeaders['range'];
  const cacheKey = createCacheKey(targetUrlObj.toString(), referer, range);

  const cachedResponse = readMemoryCache(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  const upstreamHeaders = buildUpstreamHeaders(targetUrlObj, referer, incomingHeaders);
  const upstreamResponse = await fetchWithTimeout(targetUrlObj, upstreamHeaders);

  const contentType = (upstreamResponse.headers.get('content-type') || '').toLowerCase();
  const isPlaylist = shouldTreatAsPlaylist(targetUrlObj.pathname, contentType);
  const requestUrlObj = new URL(c.req.url);

  let body;
  let bodyBytes;

  if (isPlaylist && upstreamResponse.ok) {
    const playlistText = await upstreamResponse.text();
    const rewritten = rewritePlaylist(playlistText, targetUrlObj.toString(), requestUrlObj, referer);
    body = rewritten;
    bodyBytes = new TextEncoder().encode(rewritten);
  } else {
    const rawBytes = new Uint8Array(await upstreamResponse.arrayBuffer());
    body = rawBytes;
    bodyBytes = rawBytes;
  }

  const responseHeaders = selectResponseHeaders(upstreamResponse.headers, {
    isPlaylist,
    bodySize: bodyBytes.byteLength,
  });

  const response = new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });

  const canCache =
    (upstreamResponse.status === 200 || upstreamResponse.status === 206) &&
    (isPlaylist || bodyBytes.byteLength <= PROXY_MAX_CACHEABLE_BYTES);

  if (canCache) {
    writeMemoryCache(
      cacheKey,
      {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: [...responseHeaders.entries()],
        body: bodyBytes,
      },
      isPlaylist ? PROXY_PLAYLIST_TTL_MS : PROXY_ASSET_TTL_MS
    );
  }

  return response;
}

async function legacyProxy(c, url, referer) {
  const incomingHeaders = c.req.header();
  const headers = {
    'User-Agent': incomingHeaders['user-agent'] || DEFAULT_USER_AGENT,
  };

  if (referer) {
    headers['Referer'] = referer;
  }

  if (incomingHeaders['range']) {
    headers['Range'] = incomingHeaders['range'];
  }

  const response = await fetch(url, { headers });

  const contentType = response.headers.get('content-type');
  const isM3U8 =
    contentType &&
    (contentType.includes('mpegurl') ||
      url.toLowerCase().includes('.m3u8') ||
      url.toLowerCase().includes('.m3u'));

  let body = response.body;

  const newHeaders = new Headers();
  const allowHeaders = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'cache-control',
    'expires',
    'last-modified',
  ];
  allowHeaders.forEach((h) => {
    const val = response.headers.get(h);
    if (val) newHeaders.set(h, val);
  });

  if (isM3U8 && response.ok) {
    const text = await response.text();
    const reqUrlObj = new URL(c.req.url);
    const proxyBase = `${reqUrlObj.origin}${reqUrlObj.pathname}`;

    const rewriteUrl = (target) => {
      if (!target) return target;
      try {
        const resolved = new URL(target, url).toString();
        return `${proxyBase}?url=${encodeURIComponent(resolved)}&referer=${encodeURIComponent(referer || '')}`;
      } catch {
        return target;
      }
    };

    const newText = text
      .replace(/^(?!#)(.+)$/gm, (match) => {
        const trimmed = match.trim();
        if (trimmed.length === 0) return match;
        return rewriteUrl(trimmed);
      })
      .replace(/URI="([^"]+)"/g, (_match, p1) => {
        return `URI="${rewriteUrl(p1)}"`;
      });

    body = newText;
    newHeaders.delete('content-length');
  }

  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('x-proxy-fallback', 'legacy');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default async function proxyHandler(c) {
  const { url, referer } = c.req.valid('query');

  try {
    return await hardenedProxy(c, url, referer);
  } catch (error) {
    if (error instanceof ProxyError && error.noFallback) {
      return makeErrorResponse(c, error);
    }

    console.error('Hardened proxy failed, falling back to legacy proxy:', error);

    try {
      return await legacyProxy(c, url, referer);
    } catch (legacyError) {
      console.error('Legacy proxy fallback failed:', legacyError);
      return makeErrorResponse(c, legacyError);
    }
  }
}
