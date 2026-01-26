export default async function proxyHandler(c) {
  const { url, referer } = c.req.valid('query');

  try {
    const incomingHeaders = c.req.header();
    const headers = {
      'User-Agent': incomingHeaders['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    if (referer) {
      headers['Referer'] = referer;
    }

    if (incomingHeaders['range']) {
      headers['Range'] = incomingHeaders['range'];
    }

    const response = await fetch(url, { headers });

    const contentType = response.headers.get('content-type');
    const isM3U8 = contentType && (contentType.includes('mpegurl') || url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('.m3u'));

    let body = response.body;
    
    const newHeaders = new Headers();
    const allowHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'expires', 'last-modified'];
    allowHeaders.forEach(h => {
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
            } catch (e) {
                return target;
            }
        };

        const newText = text.replace(/^(?!#)(.+)$/gm, (match) => {
            const trimmed = match.trim();
            if (trimmed.length === 0) return match;
            return rewriteUrl(trimmed);
        }).replace(/URI="([^"]+)"/g, (match, p1) => {
            return `URI="${rewriteUrl(p1)}"`;
        });

        body = newText;
        newHeaders.delete('content-length');
    }

    newHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return c.json({ error: 'Failed to proxy request', details: error.message }, 500);
  }
}

