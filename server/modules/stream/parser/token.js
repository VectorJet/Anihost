import * as cheerio from 'cheerio';
import config from '@/config/config.js';

const { baseurl } = config;

/* =======================
   CONSTANTS
======================= */
const MAX_RETRIES = 3;
const TIMEOUT = 10_000;
const MIN_TOKEN_LENGTH = 10;
const ROUTER_HOST = 'router.parklogic.com';

/* =======================
   PUBLIC API
======================= */
export default async function extractToken(url, retry = 0) {
  try {
    const html = await fetchHTML(url);
    const resolvedHtml = await resolveChallengePage(url, html);

    return (
      extractFromMeta(resolvedHtml) ||
      extractFromDataAttr(resolvedHtml) ||
      extractFromNonce(resolvedHtml) ||
      extractFromWindowStrings(resolvedHtml) ||
      extractFromWindowObjects(resolvedHtml) ||
      extractFromCompoundWindowObject(resolvedHtml) ||
      extractFromComments(resolvedHtml) ||
      extractFromLegacyPatterns(resolvedHtml) ||
      throwNoToken()
    );
  } catch (err) {
    console.error(err.message);
    if (retry < MAX_RETRIES - 1) {
      await backoff(retry);
      return extractToken(url, retry + 1);
    }
    return null;
  }
}

/* =======================
   FETCH
======================= */

const fetchHTML = async (url, extraHeaders = {}) => {
  const controller = new AbortController();

  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: {
        Referer: `${baseurl}/`,
        'User-Agent': config.headers['User-Agent'],
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest',
        ...(config.megacloudCookie ? { Cookie: config.megacloudCookie } : {}),
        ...extraHeaders,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(id);
  }
};

const postText = async (url, body, extraHeaders = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Referer: url,
        Origin: new URL(url).origin,
        'User-Agent': config.headers['User-Agent'],
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'text/plain;charset=UTF-8',
        ...(config.megacloudCookie ? { Cookie: config.megacloudCookie } : {}),
        ...extraHeaders,
      },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } finally {
    clearTimeout(id);
  }
};

/* =======================
   CHALLENGE RESOLUTION
======================= */

const resolveChallengePage = async (url, html) => {
  if (!isRouterChallengePage(html)) {
    return html;
  }

  const payload = extractRouterPayload(html);
  const routerUrl = extractRouterUrl(html, url);

  if (!payload || !routerUrl) {
    return html;
  }

  const solvedBody = buildRouterPayload(payload);
  const routerResponse = await postText(routerUrl, solvedBody, {
    Referer: url,
    Origin: new URL(routerUrl).origin,
  });

  if (routerResponse.startsWith('http://') || routerResponse.startsWith('https://')) {
    return fetchHTML(routerResponse, {
      Referer: url,
    });
  }

  return routerResponse;
};

const isRouterChallengePage = (html) =>
  html.includes(ROUTER_HOST) && html.includes('JSON.parse(atob(') && html.includes('adBlockingDetected');

const extractRouterPayload = (html) => {
  const match = html.match(/"(eyJ[a-zA-Z0-9+/=]{100,})",t\);\(async function\(t,e\)/);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
};

const extractRouterUrl = (html, fallbackUrl) => {
  const match = html.match(/\)\("(https:\/\/router\.parklogic\.com\/[^\"]+)"\s*,\s*e\)/);
  return match?.[1] || fallbackUrl;
};

const buildRouterPayload = (payload) => {
  const cloned = structuredClone(payload);
  const params = cloned.parameters ?? {};

  params.adBlockingDetected = false;
  params.timezoneBrowser = Intl.DateTimeFormat().resolvedOptions().timeZone;
  params.webdriver = false;
  params.gpu = null;
  cloned.parameters = params;

  return JSON.stringify(cloned);
};

/* =======================
   EXTRACTION METHODS
======================= */

const extractFromMeta = (html) => {
  const $ = cheerio.load(html);
  return validate($('meta[name="_gg_fb"]').attr('content'));
};

const extractFromDataAttr = (html) => {
  const $ = cheerio.load(html);
  return validate($('[data-dpi]').attr('data-dpi'));
};

const extractFromNonce = (html) => {
  const $ = cheerio.load(html);
  return validate(
    $('script[nonce]')
      .map((_, el) => $(el).attr('nonce'))
      .get()
      .find((value) => validate(value, 32))
  );
};

const extractFromWindowStrings = (html) => {
  const regex = /window\.(\w+)\s*=\s*["']([a-zA-Z0-9_-]{10,})["']/g;

  for (const match of html.matchAll(regex)) {
    const token = validate(match[2]);
    if (token) return token;
  }

  const altRegex = /_xy_ws\s*=\s*["']([a-zA-Z0-9_-]{10,})["']/g;
  for (const match of html.matchAll(altRegex)) {
    const token = validate(match[1]);
    if (token) return token;
  }
};

const extractFromWindowObjects = (html) => {
  const regex = /window\.(\w+)\s*=\s*(\{[\s\S]*?\});/g;

  for (const match of html.matchAll(regex)) {
    try {
      const obj = new Function(`return ${match[2]}`)();
      if (!obj || typeof obj !== 'object') continue;

      const joined = Object.values(obj)
        .filter((v) => typeof v === 'string')
        .join('');

      const token = validate(joined, 20);
      if (token) return token;
    } catch {
      continue;
    }
  }
};

const extractFromCompoundWindowObject = (html) => {
  const match = html.match(
    /_lk_db\s*=\s*\{[\s\S]*?x:\s*"([^\"]+)"[\s\S]*?y:\s*"([^\"]+)"[\s\S]*?z:\s*"([^\"]+)"/
  );

  if (!match) return null;
  return validate(`${match[1]}${match[2]}${match[3]}`, 20);
};

const extractFromComments = (html) => {
  const $ = cheerio.load(html);
  let token = null;

  $('*')
    .contents()
    .each((_, node) => {
      if (node.type !== 'comment') return;

      const match = node.data.trim().match(/(?:_is_th|token|key):([a-zA-Z0-9_-]{10,})/);

      if (match) {
        token = match[1];
        return false;
      }
    });

  return validate(token);
};

const extractFromLegacyPatterns = (html) => {
  const patterns = [
    /_is_th:(\S+?)\s/,
    /["']([a-zA-Z0-9_-]{48})["']/, // legacy long token fallback
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const candidate = match?.[1];
    const token = validate(candidate, candidate?.length >= 48 ? 48 : MIN_TOKEN_LENGTH);
    if (token) return token;
  }

  return null;
};

/* =======================
   UTIL
======================= */

const validate = (value, min = MIN_TOKEN_LENGTH) =>
  typeof value === 'string' && value.length >= min ? value : null;

const throwNoToken = () => {
  throw new Error('No token found');
};

const backoff = (retry) => new Promise((res) => setTimeout(res, 1000 * (retry + 1)));
