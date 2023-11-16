'use server'

// import 'openai/shims/web'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function listAssistants(
  ...params: Parameters<typeof openai.beta.assistants.list>
) {
  console.log('listAssistants', params)
  return openai.beta.assistants.list(...params)
}

export async function deleteAssistant(
  ...params: Parameters<typeof openai.beta.assistants.del>
) {
  console.log('deleteAssistant', params)
  return openai.beta.assistants.del(...params)
}
