import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './oai-routes'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listRuns, async (c) => {
  const { thread_id } = c.req.valid('param')

  // TODO: there is a type issue with non-string query params not being recognized
  // const { after, before, limit, order } = c.req.valid('query')
  // const { after, before, limit, order } = c.req.query()
  console.log('listRuns', { thread_id })

  // TODO

  return c.jsonT({
    data: [],
    first_id: '',
    last_id: '',
    has_more: false,
    object: 'list' as const
  })
})

app.openapi(routes.createThreadAndRun, async (c) => {
  const body = c.req.valid('json')
  console.log('createThreadAndRun', { body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.createRun, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createRun', { thread_id, body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.getRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('getRun', { thread_id, run_id })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.modifyRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyRun', { thread_id, run_id, body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.submitToolOuputsToRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('submitToolOuputsToRun', { thread_id, run_id, body })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.cancelRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('cancelRun', { thread_id, run_id })

  // TODO

  return c.jsonT({} as any)
})

app.openapi(routes.listRunSteps, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  // TODO: there is a type issue with non-string query params not being recognized
  // const { after, before, limit, order } = c.req.valid('query')
  // const { after, before, limit, order } = c.req.query()
  console.log('listRunSteps', { thread_id, run_id })

  // TODO

  return c.jsonT({
    data: [],
    first_id: '',
    last_id: '',
    has_more: false,
    object: 'list' as const
  })
})

app.openapi(routes.getRunStep, async (c) => {
  const { thread_id, run_id, step_id } = c.req.valid('param')
  console.log('getRunStep', { thread_id, run_id, step_id })

  // TODO

  return c.jsonT({} as any)
})

export default app
