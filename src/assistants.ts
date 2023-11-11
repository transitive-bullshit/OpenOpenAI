import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'
import * as utils from './utils'
import { prisma } from './db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listAssistants, async (c) => {
  const query = c.req.valid('query')
  console.log('listAssistantFiles', query)

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.assistant.findMany(params)

  return c.jsonT(utils.getPaginatedObject(res, params))
})

app.openapi(routes.createAssistant, async (c) => {
  const body = c.req.valid('json')
  console.log('createAssistant', { body })

  const res = await prisma.assistant.create({
    data: utils.convertOAIToPrisma(body)
  })

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.getAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  console.log('getAssistant', { assistant_id })

  const res = await prisma.assistant.findUnique({
    where: {
      id: assistant_id
    }
  })

  if (!res) return c.notFound() as any
  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.modifyAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyAssistant', { assistant_id, body })

  const res = await prisma.assistant.update({
    where: {
      id: assistant_id
    },
    data: utils.convertOAIToPrisma(body)
  })

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.deleteAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  console.log('deleteAssistant', { assistant_id })

  const res = await prisma.assistant.delete({
    where: {
      id: assistant_id
    }
  })

  return c.jsonT({
    deleted: true,
    id: res.id,
    object: 'assistant.deleted' as const
  })
})

export default app
