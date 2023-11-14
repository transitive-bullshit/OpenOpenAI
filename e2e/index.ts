import assert from 'node:assert'

import { createAIFunction } from '@dexaai/dexter/prompt'
import { sha256 } from 'crypto-hash'
import delay from 'delay'
import 'dotenv/config'
import OpenAI from 'openai'
import { oraPromise } from 'ora'
import pMap from 'p-map'
import plur from 'plur'
import { z } from 'zod'

import type { Run } from '~/lib/db'

async function main() {
  const defaultBaseUrl = 'https://api.openai.com/v1'
  const baseUrl = process.env.OPENAI_API_BASE_URL ?? defaultBaseUrl
  const isOfficalAPI = baseUrl === defaultBaseUrl
  const testId =
    process.env.TEST_ID ??
    `test_${(await sha256(Date.now().toString())).slice(0, 24)}`
  const metadata = { testId, isOfficalAPI }
  const cleanupTest = !process.env.NO_TEST_CLEANUP

  console.log('baseUrl', baseUrl)
  console.log('testId', testId)
  console.log()

  const openai = new OpenAI({
    baseURL: baseUrl
  })

  const getWeather = createAIFunction(
    {
      name: 'get_weather',
      description: 'Gets the weather for a given location',
      argsSchema: z.object({
        location: z
          .string()
          .describe('The city and state e.g. San Francisco, CA'),
        unit: z
          .enum(['c', 'f'])
          .optional()
          .default('f')
          .describe('The unit of temperature to use')
      })
    },
    // Fake weather API implementation which returns a random temperature
    // after a short delay
    async function getWeather(args) {
      await delay(500)

      return {
        location: args.location,
        unit: args.unit,
        temperature: (Math.random() * 100) | 0
      }
    }
  )

  let assistant: Awaited<
    ReturnType<typeof openai.beta.assistants.create>
  > | null = null
  let thread: Awaited<ReturnType<typeof openai.beta.threads.create>> | null =
    null

  try {
    assistant = await openai.beta.assistants.create({
      model: 'gpt-4-1106-preview',
      instructions: 'You are a helpful assistant.',
      metadata,
      tools: [
        {
          type: 'function',
          function: getWeather.spec
        }
      ]
    })
    assert(assistant)
    console.log('created assistant', assistant)

    thread = await openai.beta.threads.create({
      metadata,
      messages: [
        {
          role: 'user',
          content: 'What is the weather in San Francisco today?',
          metadata
        }
      ]
    })
    assert(thread)
    console.log('created thread', thread)

    let listMessages = await openai.beta.threads.messages.list(thread.id)
    assert(listMessages?.data)
    console.log('messages', listMessages.data)

    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
      metadata,
      instructions: assistant.instructions,
      model: assistant.model,
      tools: assistant.tools
    })
    assert(run?.id)
    console.log('created run', run)

    let listRunSteps = await openai.beta.threads.runs.steps.list(
      thread.id,
      run.id
    )
    assert(listRunSteps?.data)
    console.log('runSteps', listRunSteps.data)

    async function waitForRunStatus(
      status: Run['status'],
      { intervalMs = 500 }: { intervalMs?: number } = {}
    ) {
      assert(run?.id)

      return oraPromise(async () => {
        while (run.status !== status) {
          await delay(intervalMs)

          assert(thread?.id)
          assert(run?.id)

          run = await openai.beta.threads.runs.retrieve(thread.id, run.id)

          assert(run?.id)
        }
      }, `waiting for run "${run.id}" to have status "${status}"...`)
    }

    await waitForRunStatus('requires_action')
    console.log('run', run)

    listRunSteps = await openai.beta.threads.runs.steps.list(thread.id, run.id)
    assert(listRunSteps?.data)
    console.log('runSteps', listRunSteps.data)

    if (run.status !== 'requires_action') {
      throw new Error(
        `run "${run.id}" status expected to be "requires_action"; found "${run.status}"`
      )
    }

    if (!run.required_action) {
      throw new Error(
        `run "${run.id}" expected to have "required_action"; none found`
      )
    }

    if (run.required_action.type !== 'submit_tool_outputs') {
      throw new Error(
        `run "${run.id}" expected to have "required_action.type" of "submit_tool_outputs; found "${run.required_action.type}"`
      )
    }

    if (!run.required_action.submit_tool_outputs?.tool_calls?.length) {
      throw new Error(
        `run "${run.id}" expected to have non-empty "required_action.submit_tool_outputs"`
      )
    }

    // Resolve tool calls
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls

    const toolOutputs = await oraPromise(
      pMap(
        toolCalls,
        async (toolCall) => {
          if (toolCall.type !== 'function') {
            throw new Error(
              `run "${run.id}" invalid submit_tool_outputs tool_call type "${toolCall.type}"`
            )
          }

          if (!toolCall.function) {
            throw new Error(
              `run "${run.id}" invalid submit_tool_outputs tool_call function"`
            )
          }

          if (toolCall.function.name !== getWeather.spec.name) {
            throw new Error(
              `run "${run.id}" invalid submit_tool_outputs tool_call function name "${toolCall.function.name}"`
            )
          }

          const toolCallResult = await getWeather(toolCall.function.arguments)
          return {
            output: JSON.stringify(toolCallResult),
            tool_call_id: toolCall.id
          }
        },
        { concurrency: 4 }
      ),
      `run "${run.id}" resolving ${toolCalls.length} tool ${plur(
        'call',
        toolCalls.length
      )}`
    )

    console.log(`submitting tool outputs for run "${run.id}"`, toolOutputs)
    run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
      tool_outputs: toolOutputs
    })
    assert(run)
    console.log('run', run)

    listRunSteps = await openai.beta.threads.runs.steps.list(thread.id, run.id)
    assert(listRunSteps?.data)
    console.log('runSteps', listRunSteps.data)

    await waitForRunStatus('completed')
    console.log('run', run)

    listRunSteps = await openai.beta.threads.runs.steps.list(thread.id, run.id)
    assert(listRunSteps?.data)
    console.log('runSteps', listRunSteps.data)

    thread = await openai.beta.threads.retrieve(thread.id)
    assert(thread)
    console.log('thread', thread)

    listMessages = await openai.beta.threads.messages.list(thread.id)
    assert(listMessages?.data)
    console.log('messages', listMessages.data)
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    if (cleanupTest) {
      // TODO: there's no way to delete messages, runs, or run steps...
      // maybe deleting the thread implicitly causes a cascade of deletes?
      // TODO: test this assumption
      if (thread?.id) {
        await openai.beta.threads.del(thread.id)
      }

      if (assistant?.id) {
        await openai.beta.assistants.del(assistant.id)
      }
    }
  }
}

main()
