import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listMessageFiles, async (c) => {
  // TODO
  const { thread_id, message_id } = c.req.valid('param')

  // TODO: there is a type issue with non-string query params not being recognized
  // const { after, before, order } = c.req.valid('query')
  // const { after, before, limit, order } = c.req.query()
  console.log('listMessageFiles', { thread_id, message_id })

  // TODO

  return c.jsonT({
    data: [],
    first_id: '',
    last_id: '',
    has_more: false,
    object: 'list' as const
  })
})

app.openapi(routes.getMessageFile, async (c) => {
  const { thread_id, message_id, file_id } = c.req.valid('param')
  console.log('getMessageFile', { thread_id, message_id, file_id })

  // TODO

  return c.jsonT({ object: 'thread.message.file' as const } as any)
})

export default app
