import { Msg, type Prompt, extractJsonObject } from '@dexaai/dexter/prompt'
import { Worker } from 'bullmq'
import { asyncExitHook } from 'exit-hook'
import pMap from 'p-map'
import type { RunStepDetailsToolCallsObject } from 'src/generated/oai'
import {
  convertAssistantToolCallsToChatMessage,
  convertAssistantToolsToChatMessageTools,
  deepMergeArray
} from 'src/lib/utils'

import * as config from '../lib/config'
import { type Run, prisma } from '../lib/db'
import type { JobData, JobResult } from '../lib/types'
import { chatModel } from './models'

export const worker = new Worker<JobData, JobResult>(
  config.queue.name,
  async (job) => {
    if (job.name !== config.queue.threadRunJobName) {
      throw new Error(`Unknown job name: ${job.name}`)
    }

    const { runId } = job.data
    let jobErrorResult: JobResult | undefined

    async function checkRunStatus(
      run: Run,
      { strict = true }: { strict?: boolean } = {}
    ) {
      if (!run) {
        throw new Error(`Invalid run id "${runId}"`)
      }

      if (run.status === 'cancelling') {
        run = await prisma.run.update({
          where: { id: run.id },
          data: { status: 'cancelled' }
        })

        jobErrorResult = {
          runId: run.id,
          status: run.status
        }

        return jobErrorResult
      }

      if (!strict) {
        return null
      }

      if (run.status !== 'queued' && run.status !== 'requires_action') {
        jobErrorResult = {
          runId: run.id,
          status: run.status,
          error: `Run status is "${run.status}", cannot process run`
        }

        return jobErrorResult
      }

      const now = new Date()
      if (run.expires_at && run.expires_at < now) {
        run = await prisma.run.update({
          where: { id: run.id },
          data: { status: 'expired' }
        })

        jobErrorResult = {
          runId: run.id,
          status: run.status,
          error: 'Run expired'
        }

        return jobErrorResult
      }

      return null
    }

    async function pollRunStatus({ strict = true }: { strict?: boolean } = {}) {
      const run = await prisma.run.findUniqueOrThrow({
        where: { id: runId }
      })

      return checkRunStatus(run, { strict })
    }

    let run: Run
    let runStep: RunStep

    do {
      const {
        run_steps: runSteps,
        assistant,
        thread,
        ...rest
      } = await prisma.run.findUniqueOrThrow({
        where: { id: runId },
        include: { thread: true, assistant: true, run_steps: true }
      })
      run = rest

      if (await checkRunStatus(run)) {
        return jobErrorResult!
      }

      if (!thread) {
        throw new Error(`Invalid run "${runId}": thread does not exist`)
      }

      if (!assistant) {
        throw new Error(`Invalid run "${runId}": assistant does not exist`)
      }

      try {
        const startedAt = new Date()

        if (run.status !== 'in_progress') {
          run = await prisma.run.update({
            where: { id: runId },
            data: {
              status: 'in_progress',
              started_at: run.started_at ? undefined : startedAt
            }
          })
        }

        const messages = await prisma.message.findMany({
          where: {
            thread_id: thread.id
          },
          orderBy: {
            created_at: 'asc'
          }
        })

        // TODO: handle image_file attachments and annotations
        let chatMessages: Prompt.Msg[] = messages
          .map((msg) => {
            switch (msg.role) {
              case 'system': {
                const content = msg.content.find((c) => c.type === 'text')?.text
                  ?.value
                if (!content) return null

                return Msg.system(content, { cleanContent: false })
              }

              case 'assistant': {
                const content = msg.content.find((c) => c.type === 'text')?.text
                  ?.value
                if (!content) return null

                return Msg.assistant(content, { cleanContent: false })
              }

              case 'user': {
                const content = msg.content.find((c) => c.type === 'text')?.text
                  ?.value
                if (!content) return null

                return Msg.user(content, { cleanContent: false })
              }

              case 'function':
                throw new Error(
                  'Invalid message role "function" should be handled internally'
                )

              case 'tool':
                throw new Error(
                  'Invalid message role "tool" should be handled internally'
                )

              default:
                throw new Error(`Invalid message role "${msg.role}"`)
            }
          })
          .filter(Boolean)

        if (assistant.instructions) {
          chatMessages = [
            Msg.system(assistant.instructions) as Prompt.Msg
          ].concat(chatMessages)
        }

        for (const runStep of runSteps) {
          if (runStep.type === 'tool_calls' && runStep.status === 'completed') {
            chatMessages = chatMessages.concat(
              convertAssistantToolCallsToChatMessage(
                runStep.step_details!.tool_calls!
              )
            )
          }
        }

        // Invoke the chat model with the thread context, asssistant config,
        // any tool outputs from previous run steps, and available tools
        const res = await chatModel.run({
          messages: chatMessages,
          model: assistant.model,
          tools: convertAssistantToolsToChatMessageTools(assistant.tools)
        })
        const { message } = res

        // Check for run cancellation or expiration
        if (await pollRunStatus()) {
          return jobErrorResult!
        }

        if (message.role !== 'assistant') {
          throw new Error(
            `Unexpected error during run "${runId}": last message should be an "assistant" message`
          )
        }

        if (Msg.isFuncCall(message)) {
          // this should never happen since we're using tools, not functions
          throw new Error(
            `Unexpected error during run "${runId}": received a function call, which should be a tools call`
          )
        } else if (Msg.isToolCall(message)) {
          let status = 'in_progress' as Run['status']

          const toolCalls =
            message.tool_calls.map<RunStepDetailsToolCallsObject>(
              (toolCall) => {
                if (toolCall.type !== 'function') {
                  throw new Error(
                    `Unsupported tool call type "${toolCall.type}"`
                  )
                }

                if (toolCall.function.name === 'retrieval') {
                  return {
                    id: toolCall.id,
                    type: 'retrieval',
                    retrieval: extractJsonObject(toolCall.function.arguments)
                  }
                } else if (toolCall.function.name === 'code_interpreter') {
                  return {
                    id: toolCall.id,
                    type: 'code_interpreter',
                    code_interpreter: {
                      input: toolCall.function.arguments,
                      // TODO: this shouldn't be required here typing-wise, because it doesn't have an output yet
                      outputs: []
                    }
                  }
                } else {
                  status = 'requires_action'

                  return {
                    id: toolCall.id,
                    type: 'function',
                    function: {
                      // TODO: this shouldn't be required here typing-wise, because it doesn't have an output yet
                      output: '{}',
                      ...toolCall.function
                    }
                  }
                }
              }
            )

          runStep = await prisma.runStep.create({
            data: {
              type: 'tool_calls',
              status: 'in_progress',
              assistant_id: assistant.id,
              thread_id: thread.id,
              run_id: run.id,
              step_details: {
                type: 'tool_calls',
                tool_calls: toolCalls
              }
            }
          })

          if (status !== run.status) {
            run = await prisma.run.update({
              where: { id: run.id },
              data: { status }
            })
          }

          // Handle retrieval and code_interpreter tool calls
          const toolResults: Record<string, any> = {}

          await pMap(
            message.tool_calls,
            async (toolCall) => {
              if (toolCall.function.name === 'retrieval') {
                // TODO: retrieval implementation
                console.error('TODO: retrieval implementation')
                toolResults[toolCall.id] = [
                  {
                    type: 'logs',
                    logs: 'Error: retrieval is not yet implemented'
                  }
                ]
              } else if (toolCall.function.name === 'code_interpreter') {
                // TODO: code_interpreter implementation
                console.error('TODO: code_interpreter implementation')
                toolResults[toolCall.id] = {
                  error: 'Error: code_interpreter is not yet implemented'
                }
              } else {
                // `function` implementation is handled by the third-party developer
                // via `submit_tool_outputs`
                return
              }
            },
            {
              concurrency: 8
            }
          )

          // Check for run cancellation or expiration
          if (await pollRunStatus()) {
            return jobErrorResult!
          }

          if (Object.keys(toolResults).length > 0) {
            for (const toolCallId of Object.keys(toolResults)) {
              const toolResult = toolResults[toolCallId]
              const toolCall = toolCalls.find(
                (toolCall) => toolCall.id === toolCallId
              )
              if (!toolCall) {
                throw new Error(
                  `Invalid tool call id "${toolCallId}" in toolResults`
                )
              }

              switch (toolCall.type) {
                case 'function':
                  throw new Error(
                    'Invalid tool call type "function" should be resolved by "submit_tool_outputs"'
                  )

                case 'retrieval':
                  toolCall.retrieval!.output = toolResult
                  break

                case 'code_interpreter':
                  toolCall.code_interpreter!.outputs = toolResult
                  break

                default:
                  throw new Error(`Invalid tool call type "${toolCall.type}"`)
              }
            }

            const completedAt = new Date()
            const isCompleted = status !== 'requires_action'

            // TODO: In-between steps, if isCompleted is `false`, we may have received
            // `submit_tool_outputs` for some tools, so we need to include any possible
            // external tool call updates in our update
            runStep = await prisma.runStep.findUniqueOrThrow({
              where: { id: runStep.id }
            })

            const mergedToolCalls = deepMergeArray(
              toolCalls,
              runStep.step_details!.tool_calls
            )

            runStep = await prisma.runStep.update({
              where: { id: runStep.id },
              data: {
                status: isCompleted ? 'completed' : undefined,
                completed_at: isCompleted ? completedAt : undefined,
                step_details: {
                  type: 'tool_calls',
                  tool_calls: mergedToolCalls
                }
              }
            })
          }

          // We will now loop because run.status === 'in_progress'
        } else {
          const completedAt = new Date()

          // TODO: handle annotations
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

          await prisma.runStep.create({
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

          run = await prisma.run.update({
            where: { id: run.id },
            data: { status: 'completed', completed_at: completedAt }
          })
        }

        if (await pollRunStatus({ strict: false })) {
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
            status: 'failed',
            failed_at: new Date(),
            last_error: err.message
          }
        })

        throw err
      }
    } while (run.status === 'in_progress')
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
