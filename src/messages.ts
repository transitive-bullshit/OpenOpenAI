import { OpenAPIHono } from '@hono/zod-openapi'
import createError from 'http-errors'

import * as routes from './generated/oai-routes'
import * as utils from './lib/utils'
import { prisma } from './lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listMessages, async (c) => {
  const { thread_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listAssistantFiles', { thread_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.message.findMany({
    orderBy: {
      created_at: 'desc'
    },
    ...params,
    where: {
      ...params?.where,
      thread_id
    }
  })

  // TODO: assistant_id and run_id may not exist here, but the output
  // types are too strict
  return c.jsonT(utils.getPaginatedObject(res, params) as any)
})

app.openapi(routes.createMessage, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createMessage', { thread_id, body })

  if (body.file_ids && body.file_ids.length > 10) {
    throw createError(400, 'Too many files')
  }

  if (body.role !== 'user') {
    throw new Error('createMessage only accepts "user" messages')
  }

  const { content, ...data } = utils.convertOAIToPrisma(body)

  const res = await prisma.message.create({
    data: {
      ...data,
      content: [
        {
          type: 'text',
          text: {
            value: content,
            annotations: []
          }
        }
      ],
      thread_id
    }
  })
  if (!res) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.getMessage, async (c) => {
  const { thread_id, message_id } = c.req.valid('param')
  console.log('getMessage', { thread_id, message_id })

  const res = await prisma.message.findUniqueOrThrow({
    where: {
      id: message_id,
      thread_id
    }
  })
  if (!res) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.modifyMessage, async (c) => {
  const { thread_id, message_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyMessage', { thread_id, message_id, body })

  const res = await prisma.message.update({
    where: {
      id: message_id,
      thread_id
    },
    data: utils.convertOAIToPrisma(body)
  })
  if (!res) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(res))
})

export default app
