import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'
import * as utils from './lib/utils'
import { prisma } from './lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listAssistantFiles, async (c) => {
  const { assistant_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listAssistantFiles', { assistant_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.assistantFile.findMany({
    ...params,
    where: {
      ...params?.where,
      assistant_id
    }
  })

  return c.jsonT(utils.getPaginatedObject(res, params))
})

app.openapi(routes.createAssistantFile, async (c) => {
  const { assistant_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createAssistantFile', { assistant_id, body })

  // TODO: add to assistant.file_ids?

  // TODO: are file ids the same as assistant file ids?
  const res = await prisma.assistantFile.create({
    data: {
      id: utils.convertOAIToPrisma(body).file_id,
      assistant_id
    }
  })

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.deleteAssistantFile, async (c) => {
  const { assistant_id, file_id } = c.req.valid('param')
  console.log('deleteAssistantFile', { assistant_id, file_id })

  const res = await prisma.assistantFile.delete({
    where: {
      id: file_id,
      assistant_id
    }
  })

  return c.jsonT({
    deleted: true,
    id: res.id,
    object: 'assistant.file.deleted' as const
  })
})

app.openapi(routes.getAssistantFile, async (c) => {
  const { assistant_id, file_id } = c.req.valid('param')
  console.log('getAssistantFile', { assistant_id, file_id })

  const res = await prisma.assistantFile.findUnique({
    where: {
      id: file_id,
      assistant_id
    }
  })

  if (!res) return c.notFound() as any
  return c.jsonT(utils.convertPrismaToOAI(res))
})

export default app
