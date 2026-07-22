// Vercel serverless proxy function for POS Backend
// Frontend dan /api/* so'rovlarini backendga yo'naltiradi

const BACKEND_URL = process.env.BACKEND_URL || 'https://pos-backend-xi-three.vercel.app';

module.exports = async (req, res) => {
  const path = req.url; // /api/... dan boshlanadi

  try {
    const targetUrl = `${BACKEND_URL}${path}`;
    const headers = {};

    // Muhim header larni kopiya qilish
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
    if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
    if (req.headers['accept']) headers['Accept'] = req.headers['accept'];

    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Body (GET va HEAD dan tashqari)
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      fetchOptions.body = bodyStr;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Backenddan qaytgan header larni kopiya qilish
    res.status(response.status);
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      // Content-encoding va transfer-encoding ni otkazib yuboramiz
      if (key !== 'content-encoding' && key !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    const text = await response.text();
    return res.send(text);
  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(502).json({ error: 'Backend serverga ulanishda xatolik' });
  }
};
