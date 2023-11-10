import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listFiles, (c) => {
  const { purpose } = c.req.valid('query')
  console.log({ purpose })

  return c.jsonT({
    data: [],
    object: 'list' as const
  })
})

app.openapi(routes.createFile, (c) => {
  const body = c.req.valid('form')
  console.log(body)

  return c.jsonT({} as any)
})

export default app
