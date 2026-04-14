export default {
  async fetch(request, env, ctx) {
    const { handleRequest } = await import('./shared.js');
    const { status, headers, body } = await handleRequest(request.url);
    return new Response(body, { status, headers });
  },
};
