export default async function proxyHandler(c) {
  const { url, referer } = c.req.valid('query');
  console.log(`Proxying: ${url} with Referer: ${referer}`);

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    if (referer) {
      headers['Referer'] = referer;
    }

    const response = await fetch(url, { headers });
    console.log(`Proxy response status: ${response.status}`);

    // Check if response is m3u8
    const contentType = response.headers.get('content-type');
    const isM3U8 = contentType && (contentType.includes('mpegurl') || url.endsWith('.m3u8') || url.endsWith('.m3u'));

    let body = response.body;
    
    if (isM3U8 && response.ok) {
        const text = await response.text();
        const reqUrlObj = new URL(c.req.url);
        const proxyBase = `${reqUrlObj.origin}${reqUrlObj.pathname}`;
        
        const rewriteUrl = (target) => {
            if (!target) return target;
            const resolved = new URL(target, url).toString();
            return `${proxyBase}?url=${encodeURIComponent(resolved)}&referer=${encodeURIComponent(referer || '')}`;
        };

        const newText = text.replace(/^(?!#)(.+)$/gm, (match) => {
            return rewriteUrl(match.trim());
        }).replace(/URI="([^"]+)"/g, (match, p1) => {
            return `URI="${rewriteUrl(p1)}"`;
        });

        body = newText;
    }

    // Copy important headers from the response
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*'); // Enable CORS for the proxy response
    newHeaders.delete('Content-Encoding'); // Remove compression header as fetch decompresses
    newHeaders.delete('Content-Length'); // Remove length as it might change or be invalid
    
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
