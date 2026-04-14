import { handleRequest } from '../src/shared.js';

export default async function handler(req, res) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const rawUrl = `${proto}://${host}${req.url}`;

    const payload = await handleRequest(rawUrl);

    res.statusCode = payload.status;
    for (const [key, value] of Object.entries(payload.headers || {})) {
      res.setHeader(key, value);
    }
    res.end(payload.body);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: error.message || 'internal error' }));
  }
}

