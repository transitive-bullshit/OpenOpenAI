import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'
import * as utils from './utils'
import { prisma } from './db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listMessages, async (c) => {
  const { thread_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listAssistantFiles', { thread_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.message.findMany({
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
    c.status(400)
    c.text('Too many files')
    return {} as any
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

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.getMessage, async (c) => {
  const { thread_id, message_id } = c.req.valid('param')
  console.log('getMessage', { thread_id, message_id })

  const res = await prisma.message.findUnique({
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

  // TODO: assistant_id and run_id may not exist here, but the output
  // types are too strict
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

export default app
