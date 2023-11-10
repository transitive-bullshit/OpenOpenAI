import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listMessages, async (c) => {
  // TODO
  const { thread_id } = c.req.valid('param')

  // TODO: there is a type issue with non-string query params not being recognized
  // const { after, before, order } = c.req.valid('query')
  // const { after, before, limit, order } = c.req.query()
  console.log('listMessages', { thread_id })

  // TODO

  return c.jsonT({
    data: [],
    first_id: '',
    last_id: '',
    has_more: false,
    object: 'list' as const
  })
})

app.openapi(routes.createMessage, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createMessage', { thread_id, body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.getMessage, async (c) => {
  const { thread_id, message_id } = c.req.valid('param')
  console.log('getMessage', { thread_id, message_id })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.modifyMessage, async (c) => {
  const { thread_id, message_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyMessage', { thread_id, message_id, body })

  // TODO

  return c.jsonT({} as any)
})

export default app
