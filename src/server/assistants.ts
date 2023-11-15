import { OpenAPIHono } from '@hono/zod-openapi'
import createHttpError from 'http-errors'

import * as routes from '~/generated/oai-routes'
import * as utils from '~/lib/utils'
import { prisma } from '~/lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listAssistants, async (c) => {
  const query = c.req.valid('query')
  console.log('listAssistantFiles', { query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.assistant.findMany(params)

  return c.jsonT(utils.getPaginatedObject(res, params))
})

app.openapi(routes.createAssistant, async (c) => {
  const body = c.req.valid('json')
  console.log('createAssistant', { body })

  if (body.file_ids?.length) {
    const hasRetrieval = body.tools?.some((tool) => tool.type === 'retrieval')
    const hasCodeInterpreter = body.tools?.some(
      (tool) => tool.type === 'code_interpreter'
    )

    if (!hasRetrieval && !hasCodeInterpreter) {
      throw createHttpError(
        400,
        'file_ids are only supported if retrieval or code_interpreter tools are enabled.'
      )
    }

    // TODO: check file_ids exist
    // TODO: check file_ids have purpose `assistants` or have an attached `AssistantFile`?
    // NOTE: These checks are probably overkill, and for our use case, it's likely
    // better to err on the side of being more permissive.
  }

  const assistant = await prisma.assistant.create({
    data: utils.convertOAIToPrisma(body)
  })

  return c.jsonT(utils.convertPrismaToOAI(assistant))
})

app.openapi(routes.getAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  console.log('getAssistant', { assistant_id })

  const assistant = await prisma.assistant.findUniqueOrThrow({
    where: {
      id: assistant_id
    }
  })
  if (!assistant) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(assistant))
})

app.openapi(routes.modifyAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyAssistant', { assistant_id, body })

  const assistant = await prisma.assistant.update({
    where: {
      id: assistant_id
    },
    data: utils.convertOAIToPrisma(body)
  })
  if (!assistant) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(assistant))
})

app.openapi(routes.deleteAssistant, async (c) => {
  const { assistant_id } = c.req.valid('param')
  console.log('deleteAssistant', { assistant_id })

  const assistant = await prisma.assistant.delete({
    where: {
      id: assistant_id
    }
  })
  if (!assistant) return c.notFound() as any

  return c.jsonT({
    deleted: true,
    id: assistant.id,
    object: 'assistant.deleted' as const
  })
})

export default app
