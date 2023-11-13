import { ChatModel, createOpenAIClient } from '@dexaai/dexter/model'
import { Msg, type Prompt } from '@dexaai/dexter/prompt'
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

    const {
      run_steps: runSteps,
      assistant,
      thread,
      ...run
    } = await prisma.run.findUniqueOrThrow({
      where: { id: runId },
      include: { thread: true, assistant: true, run_steps: true }
    })

    if (await checkRunStatus(run)) {
      return jobErrorResult!
    }

    if (!thread) {
      throw new Error('Invalid run: thread does not exist')
    }

    if (!assistant) {
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
          thread_id: thread.id
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

      const chatMessages = messages.map((msg) => {
        switch (msg.role) {
          case 'system':
            return Msg.system(
              msg.content.find((c) => c.type === 'text')?.text?.value!,
              { cleanContent: false }
            )

          case 'assistant':
            return Msg.assistant(
              msg.content.find((c) => c.type === 'text')?.text?.value!,
              { cleanContent: false }
            )

          case 'user':
            return Msg.user(
              msg.content.find((c) => c.type === 'text')?.text?.value!,
              { cleanContent: false }
            )

          case 'function': {
            if (!msg.run_id) throw new Error('Invalid message: missing run_id')
            const possibleRunSteps = runSteps.filter(
              (runStep) =>
                runStep.type === 'tool_calls' && runStep.status === 'completed'
            )

            // TODO
            return Msg.funcResult(msg.content[0].text?.value!)
          }

          case 'tool':
            // TODO
            return Msg.toolResult(msg.content[0].text?.value!)

          default:
            throw new Error(`Invalid message role "${msg.role}"`)
        }
      })

      const chatModel = new ChatModel({
        client: createOpenAIClient(),
        params: {
          model: assistant.model
        }
      })

      const assistantChatMessages = (
        assistant.instructions
          ? [Msg.system(assistant.instructions)]
          : ([] as Prompt.Msg[])
      ).concat(chatMessages)

      const res = await chatModel.run({ messages: assistantChatMessages })
      const { message } = res

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
