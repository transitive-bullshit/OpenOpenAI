import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'
import * as utils from './lib/utils'
import { prisma } from './lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listMessageFiles, async (c) => {
  const { thread_id, message_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listMessageFiles', { thread_id, message_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.messageFile.findMany(params)

  return c.jsonT(utils.getPaginatedObject(res, params))
})

app.openapi(routes.getMessageFile, async (c) => {
  const { thread_id, message_id, file_id } = c.req.valid('param')
  console.log('getMessageFile', { thread_id, message_id, file_id })

  const message = await prisma.message.findUniqueOrThrow({
    where: {
      id: message_id
    }
  })
  if (message.thread_id !== thread_id) return c.notFound() as any

  const messageFile = await prisma.messageFile.findUniqueOrThrow({
    where: {
      id: file_id
    }
  })
  if (messageFile.message_id !== message_id) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(messageFile))
})

export default app
