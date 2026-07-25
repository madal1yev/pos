// Vercel serverless proxy - API so'rovlarini backend serverga yuboradi
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export default async function handler(req, res) {
  const path = req.query.path?.join('/') || '';
  const url = `${BACKEND_URL}/api/${path}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

  console.log(`[Proxy] ${req.method} ${url}`);

  try {
    const headers = {};
    const forwardHeaders = ['content-type', 'authorization', 'cookie', 'x-requested-with'];
    for (const h of forwardHeaders) {
      if (req.headers[h]) headers[h] = req.headers[h];
    }

    const body = req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...headers,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body,
    });

    const data = await response.text();
    
    // Forward response headers
    res.status(response.status);
    try {
      res.setHeader('content-type', response.headers.get('content-type') || 'application/json');
    } catch {}
    
    res.send(data);
  } catch (error) {
    console.error(`[Proxy] Error: ${error.message}`);
    res.status(502).json({ 
      error: 'Backend serverga ulanishda xatolik',
      detail: error.message,
      hint: 'BACKEND_URL environment variable ni tekshiring'
    });
  }
}
