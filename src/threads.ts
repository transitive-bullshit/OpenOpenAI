import { OpenAPIHono } from '@hono/zod-openapi'
import pMap from 'p-map'

import * as routes from './generated/oai-routes'
import * as utils from './utils'
import { prisma } from './db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.createThread, async (c) => {
  const body = c.req.valid('json')
  console.log('createThread', { body })

  const { messages, ...data } = utils.convertOAIToPrisma(body)

  const thread = await prisma.thread.create({
    data
  })

  await pMap(
    messages,
    async (message) => {
      const { content, ...data } = utils.convertOAIToPrisma(message)

      if (data.file_ids && data.file_ids.length > 10) {
        c.status(400)
        c.text('Too many files')
        throw new Error('Too many files')
      }

      await prisma.message.create({
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
          thread_id: thread.id
        }
      })
    },
    {
      concurrency: 8
    }
  )

  return c.jsonT(utils.convertPrismaToOAI(thread))
})

app.openapi(routes.getThread, async (c) => {
  const { thread_id } = c.req.valid('param')
  console.log('getThread', { thread_id })

  const res = await prisma.thread.findUnique({
    where: {
      id: thread_id
    }
  })

  if (!res) return c.notFound() as any
  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.modifyThread, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyThread', { thread_id, body })

  const res = await prisma.message.update({
    where: {
      id: thread_id
    },
    data: utils.convertOAIToPrisma(body)
  })

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.deleteThread, async (c) => {
  const { thread_id } = c.req.valid('param')
  console.log('deleteThread', { thread_id })

  const res = await prisma.assistantFile.delete({
    where: {
      id: thread_id
    }
  })

  return c.jsonT({
    deleted: true,
    id: res.id,
    object: 'thread.deleted' as const
  })
})

export default app
