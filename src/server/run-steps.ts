import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from '~/generated/oai-routes'
import * as utils from '~/lib/utils'
import { prisma } from '~/lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listRunSteps, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listRunSteps', { thread_id, run_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.runStep.findMany({
    ...params,
    where: {
      ...params?.where,
      thread_id,
      run_id
    }
  })

  // TODO: figure out why the types aren't working here
  return c.jsonT(utils.getPaginatedObject(res, params) as any)
})

app.openapi(routes.getRunStep, async (c) => {
  const { thread_id, run_id, step_id } = c.req.valid('param')
  console.log('getRunStep', { thread_id, run_id, step_id })

  const res = await prisma.runStep.findUniqueOrThrow({
    where: {
      id: step_id,
      thread_id,
      run_id
    }
  })
  if (!res) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(res))
})

export default app
