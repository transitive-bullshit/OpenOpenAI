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
      const startedAt = new Date()

      await prisma.run.update({
        where: { id: runId },
        data: { status: 'in_progress', started_at: startedAt }
      })

      const messages = await prisma.message.findMany({
        where: {
          thread_id: thread.id
        },
        orderBy: {
          created_at: 'asc'
        }
      })

      // const lastMessage = messages[messages.length - 1]
      // if (!lastMessage) {
      //   throw new Error(`Invalid run "${runId}": no messages`)
      // }

      // if (lastMessage.role !== 'assistant') {
      //   throw new Error(
      //     `Invalid run "${runId}": last message must be an "assistant" message`
      //   )
      // }

      // TODO: maybe convert to a for loop? need to keep looping until we
      // process all messages

      const chatMessages = messages
        .map((msg) => {
          switch (msg.role) {
            case 'system':
              return [
                Msg.system(
                  msg.content.find((c) => c.type === 'text')?.text?.value!,
                  { cleanContent: false }
                )
              ]

            case 'assistant':
              // TODO: handle funcCall and toolCall messages
              throw new Error('TODO: handle funcCall and toolCall messages')

              return [
                Msg.assistant(
                  msg.content.find((c) => c.type === 'text')?.text?.value!,
                  { cleanContent: false }
                )
              ]

            case 'user':
              return [
                Msg.user(
                  msg.content.find((c) => c.type === 'text')?.text?.value!,
                  { cleanContent: false }
                )
              ]

            case 'function': {
              if (!msg.run_step_id)
                throw new Error(
                  `Invalid "${msg.role}" message: missing "run_step_id"`
                )

              const runStep = runSteps.find(
                (runStep) => runStep.id === msg.run_step_id
              )
              if (!runStep)
                throw new Error(
                  `Invalid "${msg.role}" message: invalid "run_step_id"`
                )
              if (runStep.type !== 'tool_calls')
                throw new Error(
                  `Invalid "${msg.role}" message: invalid run step`
                )

              const toolCall = runStep.step_details?.tool_calls?.find(
                (tc) => tc.type === 'function'
              )
              if (!toolCall?.function) throw new Error('Invalid tool call')

              return [
                Msg.funcResult(
                  toolCall.function?.output,
                  toolCall.function.name
                )
              ]
            }

            case 'tool': {
              if (!msg.run_step_id)
                throw new Error(
                  `Invalid "${msg.role}" message: missing "run_step_id"`
                )

              const runStep = runSteps.find(
                (runStep) => runStep.id === msg.run_step_id
              )
              if (!runStep)
                throw new Error(
                  `Invalid "${msg.role}" message: invalid "run_step_id"`
                )
              if (runStep.type !== 'tool_calls')
                throw new Error(
                  `Invalid "${msg.role}" message: invalid run step`
                )

              const toolCall = runStep.step_details?.tool_calls?.find(
                (tc) => tc.type === 'function'
              )
              if (!toolCall?.function) throw new Error('Invalid tool call')

              return [Msg.toolResult(toolCall.function?.output, toolCall.id)]
            }

            default:
              throw new Error(`Invalid message role "${msg.role}"`)
          }
        })
        .flat()

      const chatModel = new ChatModel({
        client: createOpenAIClient(),
        params: {
          model: assistant.model,
          tools: assistant.tools
        }
      })

      const assistantChatMessages = (
        assistant.instructions
          ? [Msg.system(assistant.instructions)]
          : ([] as Prompt.Msg[])
      ).concat(chatMessages)

      const res = await chatModel.run({ messages: assistantChatMessages })
      const { message } = res

      if (message.role !== 'assistant') {
        throw new Error(
          `Unexpected error for run "${runId}": last message should be an "assistant" message`
        )
      }

      const completedAt = new Date()

      if (Msg.isFuncCall(message)) {
        // TODO: this should never happen since we're using tools, not functions
      } else if (Msg.isToolCall(message)) {
        for (const toolCall of message.tool_calls) {
          // TODO
        }
      } else {
        const newMessage = await prisma.message.create({
          data: {
            content: {
              type: 'text',
              text: {
                value: message.content!,
                annotations: []
              }
            },
            role: message.role,
            assistant_id: assistant.id,
            thread_id: thread.id,
            run_id: run.id
          }
        })

        const runStep = await prisma.runStep.create({
          data: {
            type: 'message_creation',
            status: 'completed',
            completed_at: completedAt,
            assistant_id: assistant.id,
            thread_id: thread.id,
            run_id: run.id,
            step_details: {
              type: 'message_creation',
              message_creation: {
                message_id: newMessage.id
              }
            }
          }
        })

        runSteps.push(runStep)
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
