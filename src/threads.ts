import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.createThread, async (c) => {
  const body = c.req.valid('json')
  console.log('createThread', { body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.getThread, async (c) => {
  const { thread_id } = c.req.valid('param')
  console.log('getThread', { thread_id })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.modifyThread, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyThread', { thread_id, body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.deleteThread, async (c) => {
  const { thread_id } = c.req.valid('param')
  console.log('deleteThread', { thread_id })

  // TODO

  return c.jsonT({
    deleted: true,
    id: thread_id,
    object: 'thread.deleted' as const
  })
})

export default app
