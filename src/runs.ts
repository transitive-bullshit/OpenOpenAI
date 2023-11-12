import { OpenAPIHono } from '@hono/zod-openapi'
import createHttpError from 'http-errors'

import * as routes from './generated/oai-routes'
import * as utils from './lib/utils'
import { createThread } from './lib/create-thread'
import { prisma } from './lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listRuns, async (c) => {
  const { thread_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listRuns', { thread_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.run.findMany(params)

  // TODO: figure out why the types aren't working here
  return c.jsonT(utils.getPaginatedObject(res, params) as any)
})

app.openapi(routes.createThreadAndRun, async (c) => {
  const body = c.req.valid('json')
  console.log('createThreadAndRun', { body })

  await prisma.assistant.findUniqueOrThrow({
    where: {
      id: body.assistant_id
    }
  })

  const { thread: threadData, ...data } = utils.convertOAIToPrisma(body)
  const { thread } = await createThread(threadData)

  const run = await prisma.run.create({
    data: {
      ...utils.convertOAIToPrisma(data),
      thread_id: thread.id,
      status: 'queued' as const
    }
  })

  // TODO: kick off async task
  c.status(501)

  return c.jsonT(utils.convertPrismaToOAI(run))
})

app.openapi(routes.createRun, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createRun', { thread_id, body })

  await prisma.assistant.findUniqueOrThrow({
    where: {
      id: body.assistant_id
    }
  })

  const run = await prisma.run.create({
    data: {
      ...utils.convertOAIToPrisma(body),
      thread_id: thread_id,
      // TODO: is this the correct default status?
      status: 'queued' as const
    }
  })

  // TODO: kick off async task
  c.status(501)

  return c.jsonT(utils.convertPrismaToOAI(run))
})

app.openapi(routes.getRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('getRun', { thread_id, run_id })

  const res = await prisma.run.findUniqueOrThrow({
    where: {
      id: run_id,
      thread_id
    }
  })

  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

app.openapi(routes.modifyRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyRun', { thread_id, run_id, body })

  const res = await prisma.run.update({
    where: {
      id: run_id,
      thread_id
    },
    data: utils.convertOAIToPrisma(body)
  })

  // TODO: if `status` is changed, update the underlying async task accordingly
  c.status(501)

  // TODO: this cast shouldn't be necessary
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

app.openapi(routes.submitToolOuputsToRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('submitToolOuputsToRun', { thread_id, run_id, body })

  const run = await prisma.run.findUniqueOrThrow({
    where: {
      id: run_id,
      thread_id
    }
  })

  const runStep = await prisma.runStep.findUniqueOrThrow({
    // @ts-expect-error this shouldn't be complaining
    where: {
      run_id,
      type: 'tool_calls' as const
    }
  })
  if (!runStep) return c.notFound() as any

  // TODO: validate body.tool_outputs against run.tools

  switch (run.status) {
    case 'cancelled':
      throw createHttpError(
        400,
        `Run status is "${run.status}", cannot submit tool outputs`
      )

    case 'cancelling':
      throw createHttpError(
        400,
        `Run status is "${run.status}", cannot submit tool outputs`
      )

    case 'completed':
      throw createHttpError(
        400,
        `Run status is "${run.status}", cannot submit tool outputs`
      )

    case 'expired':
      throw createHttpError(
        400,
        `Run status is "${run.status}", cannot submit tool outputs`
      )

    case 'failed':
      throw createHttpError(
        400,
        `Run status is "${run.status}", cannot submit tool outputs`
      )

    case 'in_progress':
      throw createHttpError(
        400,
        `Run status is "${run.status}", cannot submit tool outputs`
      )

    case 'queued':
      throw createHttpError(
        400,
        `Run status is "${run.status}", cannot submit tool outputs`
      )

    case 'requires_action': {
      const toolCalls = runStep.step_details?.tool_calls
      if (!toolCalls) throw createHttpError(500, 'Invalid tool call')

      for (const toolOutput of body.tool_outputs) {
        const toolCall = toolCalls.find(
          (toolCall) => toolCall.id === toolOutput.tool_call_id!
        )
        if (!toolCall) throw createHttpError(400, 'Invalid tool call')

        switch (toolCall.type) {
          case 'code_interpreter':
            // TODO
            // toolCall.code_interpreter?.outputs
            throw createHttpError(
              400,
              'Invalid third-party code_interpreter tool calls are not supported at this time'
            )

          case 'function':
            toolCall.function!.output = toolOutput.output!
            break

          case 'retrieval':
            // TODO
            throw createHttpError(
              400,
              'Invalid third-party retrieval tool calls are not supported at this time'
            )

          default:
            throw createHttpError(500, 'Invalid tool call type')
        }
      }

      runStep.status = 'in_progress'

      const { id, object, created_at, ...runStepUpdate } = runStep as any
      await prisma.runStep.update({
        where: { id: runStep.id },
        data: runStepUpdate
      })

      // TODO: kick off runStep
      c.status(501)

      // TODO: validate body.tool_outputs against run.tools
      // const runStep = await prisma.runStep.update()
      // if (!runStep) return c.notFound() as any
      break
    }

    default:
      throw createHttpError(500, 'Invalid tool call type')
  }

  // TODO
  c.status(501)

  return c.jsonT({ run_id, thread_id })
})

app.openapi(routes.cancelRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('cancelRun', { thread_id, run_id })

  const res = await prisma.run.update({
    where: {
      id: run_id,
      thread_id
    },
    data: {
      status: 'cancelling',
      cancelled_at: new Date()
    }
  })

  // TODO: actual cancellation => `cancelled`
  // TODO
  c.status(501)

  // TODO: assistant_id and run_id may not exist here, but the output
  // types are too strict
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

export default app
