import { OpenAPIHono } from '@hono/zod-openapi'
import { Prisma } from '@prisma/client'
import createHttpError from 'http-errors'

import * as routes from '~/generated/oai-routes'
import * as config from '~/lib/config'
import * as utils from '~/lib/utils'
import { createThread } from '~/lib/create-thread'
import { prisma } from '~/lib/db'
import { getJobId, queue } from '~/lib/queue'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listRuns, async (c) => {
  const { thread_id } = c.req.valid('param')
  const query = c.req.valid('query')
  console.log('listRuns', { thread_id, query })

  const params = utils.getPrismaFindManyParams(query)
  const res = await prisma.run.findMany({
    ...params,
    where: {
      ...params?.where,
      thread_id
    }
  })

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

  const now = new Date().getTime()
  const run = await prisma.run.create({
    data: {
      ...utils.convertOAIToPrisma(data),
      thread_id: thread.id,
      status: 'queued' as const,
      expires_at: new Date(now + config.runs.maxRunTime)
    }
  })

  // Kick off async task
  const job = await queue.add(
    config.queue.threadRunJobName,
    { runId: run.id },
    {
      jobId: getJobId(run)
    }
  )
  console.log('job', job.asJSON())

  return c.jsonT(utils.convertPrismaToOAI(run))
})

app.openapi(routes.createRun, async (c) => {
  const { thread_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('createRun', { thread_id, body })

  // Ensure the assistant exists
  await prisma.assistant.findUniqueOrThrow({
    where: { id: body.assistant_id }
  })

  // Ensure the thread exists
  await prisma.thread.findUniqueOrThrow({
    where: { id: thread_id }
  })

  const now = new Date().getTime()
  const run = await prisma.run.create({
    data: {
      ...utils.convertOAIToPrisma(body),
      thread_id,
      status: 'queued' as const,
      expires_at: new Date(now + config.runs.maxRunTime)
    }
  })

  // Kick off async task
  const job = await queue.add(
    config.queue.threadRunJobName,
    { runId: run.id },
    {
      jobId: getJobId(run)
    }
  )
  console.log('job', job.asJSON())

  return c.jsonT(utils.convertPrismaToOAI(run))
})

app.openapi(routes.getRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('getRun', { thread_id, run_id })

  const run = await prisma.run.findUniqueOrThrow({
    where: {
      id: run_id,
      thread_id
    }
  })
  if (!run) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(run))
})

app.openapi(routes.modifyRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('modifyRun', { thread_id, run_id, body })

  const run = await prisma.run.update({
    where: {
      id: run_id,
      thread_id
    },
    data: utils.convertOAIToPrisma(body)
  })
  if (!run) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(run))
})

app.openapi(routes.submitToolOuputsToRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  const body = c.req.valid('json')
  console.log('submitToolOuputsToRun', { thread_id, run_id, body })

  let run = await prisma.run.findUniqueOrThrow({
    where: {
      id: run_id,
      thread_id
    }
  })
  if (!run) return c.notFound() as any

  let runStep = await prisma.runStep.findFirstOrThrow({
    where: {
      run_id,
      type: 'tool_calls' as const
    },
    orderBy: {
      created_at: 'desc'
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
      const requiredAction = run.required_action
      if (!requiredAction) {
        throw createHttpError(
          500,
          `Run status is "${run.status}", but missing "run.required_action"`
        )
      }

      if (requiredAction.type !== 'submit_tool_outputs') {
        throw createHttpError(
          500,
          `Run status is "${run.status}", but "run.required_action.type" is not "submit_tool_outputs"`
        )
      }

      // TODO: validate requiredAction.submit_tool_outputs

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
              'Error third-party code_interpreter tool calls are not supported at this time'
            )

          case 'function':
            toolCall.function!.output = toolOutput.output!
            break

          case 'retrieval':
            // TODO
            throw createHttpError(
              400,
              'Error third-party retrieval tool calls are not supported at this time'
            )

          default:
            throw createHttpError(500, 'Invalid tool call type')
        }
      }

      // TODO: update corresponding ToolCall?
      runStep.status = 'completed'

      const { id, object, created_at, ...runStepUpdate } = runStep as any
      runStep = await prisma.runStep.update({
        where: { id: runStep.id },
        data: runStepUpdate
      })

      run = await prisma.run.update({
        where: { id: run.id },
        data: { status: 'queued', required_action: Prisma.JsonNull }
      })

      // Resume async task
      const job = await queue.add(
        config.queue.threadRunJobName,
        { runId: run.id },
        {
          jobId: getJobId(run, runStep)
        }
      )
      console.log('job', job.asJSON())
      break
    }

    default:
      throw createHttpError(500, 'Invalid tool call type')
  }

  return c.jsonT({ run_id, thread_id })
})

app.openapi(routes.cancelRun, async (c) => {
  const { thread_id, run_id } = c.req.valid('param')
  console.log('cancelRun', { thread_id, run_id })

  let run = await prisma.run.update({
    where: {
      id: run_id,
      thread_id
    },
    data: {
      status: 'cancelling',
      cancelled_at: new Date()
    },
    include: { run_steps: true }
  })
  if (!run) return c.notFound() as any

  try {
    // Attempt to remove the cancelled run from the async task queue
    const res = await Promise.all([
      queue.remove(getJobId(run)),
      run.run_steps.length
        ? queue.remove(getJobId(run, run.run_steps[run.run_steps.length - 1]))
        : Promise.resolve(0)
    ])

    if (res[0] === 1 || res[1] === 1) {
      run = await prisma.run.update({
        where: {
          id: run_id,
          thread_id
        },
        data: {
          status: 'cancelled'
        },
        include: { run_steps: true }
      })
      if (!run) return c.notFound() as any
    }
  } catch (err) {
    console.warn(
      `Error removing cancelled run "${run_id}" from async task queue`,
      err
    )
  }

  return c.jsonT(utils.convertPrismaToOAI(run))
})

export default app
