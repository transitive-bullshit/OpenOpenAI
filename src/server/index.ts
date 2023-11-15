import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import 'dotenv/config'
import { asyncExitHook } from 'exit-hook'
import { signalsByNumber } from 'human-signals'

import * as config from '~/lib/config'
import { prisma } from '~/lib/db'
import { queue } from '~/lib/queue'

import assistantFiles from './assistant-files'
import assistants from './assistants'
import files from './files'
import messageFiles from './message-files'
import messages from './messages'
import runSteps from './run-steps'
import runs from './runs'
import threads from './threads'

const app = new OpenAPIHono()

app.use('*', async function errorHandler(c, next) {
  try {
    // Useful for debugging
    // const body = await c.req.formData()
    // console.log(body.get('file'))

    await next()
  } catch (err: any) {
    console.error('ERROR', err.message)
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

    if (err.$metadata?.httpStatusCode === 404) {
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

// TODO: these values should be taken from the source openapi spec
app.doc('/openapi', {
  openapi: '3.0.0',
  info: {
    version: '2.0.0',
    title: 'OpenAPI'
  }
})

const server = serve({
  fetch: app.fetch,
  port: config.port
})

console.log(`Server listening on port ${config.port}`)

if (config.queue.startRunner) {
  await import('~/runner/index')
}

asyncExitHook(
  async (signal: number) => {
    console.log(
      `Received signal ${
        signalsByNumber[signal - 128]?.name ?? signal - 128
      }; closing server...`
    )

    // NOTE: the order of these calls is important for edge cases
    // TODO: awaiting server.close seems to cause errors
    // await promisify(server.close)()
    server.close()
    await queue.close()
    await prisma.$disconnect()
  },
  {
    wait: config.processGracefulExitWaitTimeMs
  }
)
