'use server'

// TODO: will using the web shim work with vercel `fetch` caching?
import 'openai/shims/web'

import OpenAI from 'openai'
import type { AssistantListParams } from 'openai/resources/beta/assistants/assistants.mjs'

const openai = new OpenAI()

export async function listAssistants(query: AssistantListParams) {
  console.log('listAssistants', query)
  return openai.beta.assistants.list(query)
}

export async function deleteAssistant(
  ...params: Parameters<typeof openai.beta.assistants.del>
) {
  console.log('deleteAssistant', params)
  return openai.beta.assistants.del(...params)
}
