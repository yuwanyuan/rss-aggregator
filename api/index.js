import { handleRequest } from '../src/shared.js';

export default async function handler(request) {
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost';
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const rawUrl = `${proto}://${host}${request.url}`;

    const payload = await handleRequest(rawUrl, process.env);

    return new Response(payload.body, {
      status: payload.status,
      headers: payload.headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'internal error' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}
