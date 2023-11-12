import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'
import * as utils from './utils'
import { prisma } from './db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listRuns, async (c) => {
  const { thread_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listRuns', { thread_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.run.findMany(params)

  // TODO: figure out why the types aren't working here
  return c.jsonT(utils.getPaginatedObject(res, params) as any)
})

app.openapi(routes.createThreadAndRun, async (c) => {
  const body = c.req.valid('json')
  console.log('createThreadAndRun', { body })

  // TODO
  c.status(501)

  return c.jsonT({} as any)
})

app.openapi(routes.createRun, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createRun', { thread_id, body })

  // TODO
  c.status(501)

  return c.jsonT({} as any)
})

app.openapi(routes.getRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('getRun', { thread_id, run_id })

  const res = await prisma.run.findUnique({
    where: {
      id: run_id,
      thread_id
    }
  })

  if (!res) return c.notFound() as any
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

app.openapi(routes.modifyRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyRun', { thread_id, run_id, body })

  const res = await prisma.run.update({
    where: {
      id: run_id,
      thread_id
    },
    data: utils.convertOAIToPrisma(body)
  })

  // TODO: this cast shouldn't be necessary
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

app.openapi(routes.submitToolOuputsToRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('submitToolOuputsToRun', { thread_id, run_id, body })

  // TODO
  c.status(501)

  return c.jsonT({} as any)
})

app.openapi(routes.cancelRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('cancelRun', { thread_id, run_id })

  // TODO
  c.status(501)

  const res = await prisma.run.update({
    where: {
      id: run_id,
      thread_id
    },
    data: {
      status: 'cancelling',
      cancelled_at: new Date()
    }
  })

  // TODO: actual cancellation => `cancelled`

  // TODO: assistant_id and run_id may not exist here, but the output
  // types are too strict
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

export default app
