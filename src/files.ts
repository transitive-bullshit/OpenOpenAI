import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listFiles, async (c) => {
  const { purpose } = c.req.valid('query')
  console.log('listFiles', { purpose })

  // TODO

  return c.jsonT({
    data: [],
    object: 'list' as const
  })
})

app.openapi(routes.createFile, async (c) => {
  const body = c.req.valid('form')
  console.log('createFile', { body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.deleteFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('deleteFile', { file_id })

  // TODO

  return c.jsonT({
    deleted: true,
    id: file_id,
    object: 'file' as const
  })
})

app.openapi(routes.retrieveFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('retrieveFile', { file_id })

  // TODO

  return c.jsonT({
    object: 'file' as const
  } as any)
})

app.openapi(routes.downloadFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('downloadFile', { file_id })

  // TODO

  return c.json({})
})

export default app
