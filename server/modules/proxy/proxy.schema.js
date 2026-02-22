import { createRoute, z } from '@hono/zod-openapi';

export const proxySchema = createRoute({
  method: 'get',
  path: '/proxy',
  tags: ['Proxy'],
  summary: 'Proxy stream/media requests with playlist rewriting',
  request: {
    query: z.object({
      url: z.string().trim().min(1).openapi({
        param: {
          name: 'url',
          in: 'query',
        },
        example: 'https://example.com/master.m3u8',
      }),
      referer: z.string().optional().openapi({
        param: {
          name: 'referer',
          in: 'query',
        },
        example: 'https://megacloud.tv',
      }),
    }),
  },
  responses: {
    200: {
      description: 'The proxied content',
    },
  },
});
