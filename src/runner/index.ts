import { Worker } from 'bullmq'
import { asyncExitHook } from 'exit-hook'

import * as config from '../lib/config'
import { type Run, prisma } from '../lib/db'
import type { JobData, JobResult } from '../lib/types'

export const worker = new Worker<JobData, JobResult>(
  config.queue.name,
  async (job) => {
    if (job.name !== config.queue.threadRunJobName) {
      throw new Error(`Unknown job name: ${job.name}`)
    }

    const { runId } = job.data
    let jobErrorResult: JobResult | undefined

    async function checkRunStatus(run: Run) {
      if (!run) {
        throw new Error(`Invalid run id "${runId}"`)
      }

      if (run.status === 'cancelling') {
        run = await prisma.run.update({
          where: { id: runId },
          data: { status: 'cancelled' }
        })

        jobErrorResult = {
          runId,
          status: run.status
        }

        return jobErrorResult
      }

      if (run.status !== 'queued' && run.status !== 'requires_action') {
        jobErrorResult = {
          runId,
          status: run.status,
          error: `Run status is "${run.status}", cannot process run`
        }

        return jobErrorResult
      }

      return null
    }

    async function pollRunStatus() {
      const run = await prisma.run.findUniqueOrThrow({
        where: { id: runId }
      })

      return checkRunStatus(run)
    }

    const { run_steps: runSteps, ...run } = await prisma.run.findUniqueOrThrow({
      where: { id: runId },
      include: { thread: true, assistant: true, run_steps: true }
    })

    if (await checkRunStatus(run)) {
      return jobErrorResult!
    }

    if (!run.thread) {
      throw new Error('Invalid run: thread does not exist')
    }

    if (!run.assistant) {
      throw new Error('Invalid run: assistant does not exist')
    }

    try {
      const now = new Date()

      await prisma.run.update({
        where: { id: runId },
        data: { status: 'in_progress', started_at: now }
      })

      const messages = await prisma.message.findMany({
        where: {
          thread_id: run.thread.id
        },
        orderBy: {
          created_at: 'asc'
        }
      })

      const lastMessage = messages[messages.length - 1]
      if (!lastMessage) {
        throw new Error(`Invalid run "${runId}": no messages`)
      }

      if (lastMessage.role !== 'assistant') {
        throw new Error(
          `Invalid run "${runId}": last message must be an "assistant" message`
        )
      }

      // TODO
      throw new Error('not yet implemented')

      if (await pollRunStatus()) {
        return jobErrorResult!
      }

      return {
        runId,
        status: run.status
      }
    } catch (err: any) {
      await prisma.run.update({
        where: { id: runId },
        data: {
          last_error: err.message
        }
      })

      throw err
    }
  },
  {
    connection: config.queue.RedisConfig,
    // TODO: for development, set this to 1
    concurrency: config.queue.concurrency,
    stalledInterval: config.queue.stalledInterval
  }
)

asyncExitHook(
  async (signal: number) => {
    console.log(`Received ${signal}; closing runner...`)

    // NOTE: the order of these calls is important for edge cases
    await worker.close()
    await prisma.$disconnect()
  },
  {
    wait: 5000
  }
)
