import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'
import * as utils from './lib/utils'
import { createThread } from './lib/create-thread'
import { prisma } from './lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.createThread, async (c) => {
  const body = c.req.valid('json')
  console.log('createThread', { body })

  const { thread } = await createThread(body)

  // TODO: this cast shouldn't be necessary
  return c.jsonT(utils.convertPrismaToOAI(thread) as any)
})

app.openapi(routes.getThread, async (c) => {
  const { thread_id } = c.req.valid('param')
  console.log('getThread', { thread_id })

  const res = await prisma.thread.findUniqueOrThrow({
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

  // TODO: this cast shouldn't be necessary
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
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
