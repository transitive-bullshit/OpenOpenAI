import type { z } from '@hono/zod-openapi'
import createError from 'http-errors'
import pMap from 'p-map'

import * as routes from '../generated/oai-routes'
import * as utils from './utils'
import { prisma } from './db'

const CreateThreadParamsSchema =
  routes.createThread.request.body.content['application/json'].schema
type CreateThreadParams = z.infer<typeof CreateThreadParamsSchema>

export async function createThread(params: CreateThreadParams) {
  const { messages: messageInputs, ...data } = utils.convertOAIToPrisma(params)

  // TODO: wrap this all in a transaction?
  const thread = await prisma.thread.create({
    data
  })

  const messages = await pMap(
    messageInputs,
    async (message) => {
      const { content, ...data } = utils.convertOAIToPrisma(message)

      if (data.file_ids && data.file_ids.length > 10) {
        throw createError(400, 'Too many files')
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

  return {
    thread,
    messages
  }
}
