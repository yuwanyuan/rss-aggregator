import { handleRequest } from './shared.js';

export default {
  async fetch(request, env, ctx) {
    const { status, headers, body } = await handleRequest(request.url, env);
    return new Response(body, { status, headers });
  },
};

