import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listAssistants, async (c) => {
  // TODO: there is a type issue with non-string query params not being recognized
  // const { after, before, limit, order } = c.req.valid('query')
  // const { after, before, limit, order } = c.req.query()
  console.log('listAssistantFiles')

  // TODO

  return c.jsonT({
    data: [],
    first_id: '',
    last_id: '',
    has_more: false,
    object: 'list' as const
  })
})

app.openapi(routes.createAssistant, async (c) => {
  const body = c.req.valid('json')
  console.log('createAssistant', { body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.getAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  console.log('getAssistant', { assistant_id })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.modifyAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyAssistant', { assistant_id, body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.deleteAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  console.log('deleteAssistant', { assistant_id })

  // TODO

  return c.jsonT({
    deleted: true,
    id: assistant_id,
    object: 'assistant.deleted' as const
  })
})

export default app
