import { OpenAPIHono } from '@hono/zod-openapi'
import createHttpError from 'http-errors'

import * as routes from '~/generated/oai-routes'
import * as utils from '~/lib/utils'
import { prisma } from '~/lib/db'
import { processFileForAssistant } from '~/lib/retrieval'

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
  const { file_id } = body

  // Ensure assistant exists
  const assistant = await prisma.assistant.findUniqueOrThrow({
    where: { id: assistant_id }
  })
  if (assistant.file_ids.includes(file_id)) {
    throw createHttpError(409, 'File is already attached to assistant')
  }

  const file = await prisma.file.findUniqueOrThrow({
    where: { id: file_id }
  })

  const assistantFile = await prisma.assistantFile.create({
    data: {
      id: file_id,
      assistant_id
    }
  })

  // Process file for assistant (knowledge retrieval pre-processing)
  await processFileForAssistant(file)
  await prisma.assistant.update({
    where: { id: assistant_id },
    data: {
      file_ids: {
        push: file_id
      }
    }
  })

  return c.jsonT(utils.convertPrismaToOAI(assistantFile))
})

app.openapi(routes.deleteAssistantFile, async (c) => {
  const { assistant_id, file_id } = c.req.valid('param')
  console.log('deleteAssistantFile', { assistant_id, file_id })

  const assistantFile = await prisma.assistantFile.delete({
    where: {
      id: file_id,
      assistant_id
    }
  })
  if (!assistantFile) return c.notFound() as any

  return c.jsonT({
    deleted: true,
    id: assistantFile.id,
    object: 'assistant.file.deleted' as const
  })
})

app.openapi(routes.getAssistantFile, async (c) => {
  const { assistant_id, file_id } = c.req.valid('param')
  console.log('getAssistantFile', { assistant_id, file_id })

  const assistantFile = await prisma.assistantFile.findUniqueOrThrow({
    where: {
      id: file_id,
      assistant_id
    }
  })
  if (!assistantFile) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(assistantFile))
})

export default app
