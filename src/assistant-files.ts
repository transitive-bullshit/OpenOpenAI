import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listAssistantFiles, async (c) => {
  const { assistant_id } = c.req.valid('param')

  // TODO: there is a type issue with non-string query params not being recognized
  // const { after, before, limit, order } = c.req.valid('query')
  // const { after, before, limit, order } = c.req.query()
  console.log('listAssistantFiles', { assistant_id })

  // TODO

  return c.jsonT({
    data: [],
    first_id: '',
    last_id: '',
    has_more: false,
    object: 'list' as const
    // items: {} // TODO: why does this exist on the response type?
  })
})

app.openapi(routes.createAssistantFile, async (c) => {
  const { assistant_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createAssistantFile', { assistant_id, body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.deleteAssistantFile, async (c) => {
  const { assistant_id, file_id } = c.req.valid('param')
  console.log('deleteAssistantFile', { assistant_id, file_id })

  // TODO

  return c.jsonT({
    deleted: true,
    id: file_id,
    object: 'assistant.file.deleted' as const
  })
})

app.openapi(routes.getAssistantFile, async (c) => {
  const { assistant_id, file_id } = c.req.valid('param')
  console.log('getAssistantFile', { assistant_id, file_id })

  // TODO

  return c.jsonT({
    object: 'file' as const
  } as any)
})

export default app
