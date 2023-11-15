import assert from 'node:assert'
import fs from 'node:fs'

import { sha256 } from 'crypto-hash'
import delay from 'delay'
import 'dotenv/config'
import OpenAI from 'openai'
import { oraPromise } from 'ora'

import type { Run } from '~/lib/db'

/**
 * This file contains an end-to-end Assistants example using the built-in
 * `retrieval` tool which summarizes an attached markdown file.
 *
 * To run it against the offical OpenAI API:
 * ```bash
 * npx tsx e2e/retrieval.ts
 * ```
 *
 * To run it against your custom, local API:
 * ```bash
 * OPENAI_API_BASE_URL='http://localhost:3000' npx tsx e2e/retrieval.ts
 * ```
 */
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

  let assistant: Awaited<
    ReturnType<typeof openai.beta.assistants.create>
  > | null = null
  let thread: Awaited<ReturnType<typeof openai.beta.threads.create>> | null =
    null

  const readmeFileStream = fs.createReadStream('readme.md', 'utf8')

  const readmeFile = await openai.files.create({
    file: readmeFileStream,
    purpose: 'assistants'
  })
  console.log('created readme file', readmeFile)

  try {
    assistant = await openai.beta.assistants.create({
      model: 'gpt-4-1106-preview',
      instructions: 'You are a helpful assistant.',
      metadata,
      tools: [
        {
          type: 'retrieval'
        }
      ],
      file_ids: [readmeFile.id]
    })
    assert(assistant)
    console.log('created assistant', assistant)

    thread = await openai.beta.threads.create({
      metadata,
      messages: [
        {
          role: 'user',
          content:
            'Give me a concise summary of the attached file using markdown.',
          metadata
        }
      ]
    })
    assert(thread)
    console.log('created thread', thread)

    let listMessages = await openai.beta.threads.messages.list(thread.id)
    assert(listMessages?.data)
    console.log('messages', prettifyMessages(listMessages.data))

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
          if (
            status !== run.status &&
            (run.status === 'cancelled' ||
              run.status === 'cancelling' ||
              run.status === 'failed' ||
              run.status === 'expired')
          ) {
            throw new Error(
              `Error run "${run.id}" status reached terminal status "${run.status}" while waiting for status "${status}"`
            )
          }

          await delay(intervalMs)

          assert(thread?.id)
          assert(run?.id)

          run = await openai.beta.threads.runs.retrieve(thread.id, run.id)

          assert(run?.id)
        }
      }, `waiting for run "${run.id}" to have status "${status}"...`)
    }

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
    console.log('messages', prettifyMessages(listMessages.data))
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

// Make message content easier to read in the console
function prettifyMessages(messages: any[]) {
  return messages.map((message) => ({
    ...message,
    content: message.content?.[0]?.text?.value ?? message.content
  }))
}

main()
