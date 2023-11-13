import { promisify } from 'node:util'

import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { asyncExitHook } from 'exit-hook'

import assistantFiles from './assistant-files'
import assistants from './assistants'
import files from './files'
import { prisma } from './lib/db'
import { queue } from './lib/queue'
import messageFiles from './message-files'
import messages from './messages'
import runSteps from './run-steps'
import runs from './runs'
import threads from './threads'

const app = new OpenAPIHono()

app.use('*', async function errorHandler(c, next) {
  try {
    await next()
  } catch (err: any) {
    const statusCode = err.statusCode || err.status

    // handle https://github.com/jshttp/http-errors
    if (statusCode) {
      c.status(statusCode)
      if (err.message) {
        c.text(err.message)
      }
      return
    }

    // handle prisma errors
    if (err.code === 'P2025') {
      return c.notFound() as any
    }

    throw err
  }
})

app.route('', files)
app.route('', assistants)
app.route('', assistantFiles)
app.route('', threads)
app.route('', messages)
app.route('', messageFiles)
app.route('', runs)
app.route('', runSteps)

app.doc('/openapi', {
  openapi: '3.0.0',
  info: {
    version: '2.0.0',
    title: 'OpenAPI'
  }
})

app.showRoutes()

const server = serve(app)

asyncExitHook(
  async (signal: number) => {
    console.log(`Received ${signal}; closing server...`)

    // NOTE: the order of these calls is important for edge cases
    await promisify(server.close)()
    await queue.close()
    await prisma.$disconnect()
  },
  {
    wait: 5000
  }
)
