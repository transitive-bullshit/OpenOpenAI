import { createAIFunction } from '@dexaai/dexter/prompt'
import pMap from 'p-map'
import { z } from 'zod'

import type { File } from './db'
import { getObject } from './storage'
import { getNormalizedFileName } from './utils'

export async function processFilesForAssistant(files: File[]): Promise<void> {
  console.log('processFilesForAssistant', files)
  await pMap(files, processFileForAssistant, { concurrency: 4 })
}

/**
 * Preprocess file for knowledge retrieval.
 *
 * This may include things like chunking and upserting into a vector database.
 *
 * At retrieval time, you are given an array of `file_ids` to filter by, so
 * make sure to store the `file_id` in the database.
 */
export async function processFileForAssistant(file: File): Promise<void> {
  console.log('processFileForAssistant', file)

  // TODO: encapsulate the getObject and key in a `files` module
  const object = await getObject(file.filename)
  const _ = await object.Body!.transformToString()

  // TODO: we're not actually pre-processing the file yet
  // @see https://github.com/transitive-bullshit/OpenOpenAI/issues/2

  file.status = 'processed'
}

export const retrievalFunction = createAIFunction(
  {
    name: 'retrieval',
    description: 'Retrieves relevant context from a set of attached files',
    argsSchema: z.object({
      query: z.string()
    })
  },
  async () => {
    // not used
    throw new Error('This should never be called')
  }
)

/**
 * Performs knowledge retrieval for a given `query` on a set of `file_ids` for RAG.
 *
 * This function contains the runtime implementation of the built-in `retrieval`
 * tool, which can be enabled on assistants to search arbitrary user files.
 *
 * TODO: implement actual semantic retrieval
 * TODO: perform context compression / truncation of the retrieved context
 */
export async function retrievalTool({
  query: _,
  files
}: {
  query: string
  files: File[]
}): Promise<string[]> {
  const filesWithContent = (
    await pMap(files, getFileContent, {
      concurrency: 8
    })
  ).filter(Boolean)

  return filesWithContent.map((file) => {
    return `Filename: ${getNormalizedFileName(file.file)}\n\n${file.content}`
  })
}

async function getFileContent(
  file: File
): Promise<{ file: File; content: string } | null> {
  // TODO: encapsulate the getObject and key in a `files` module
  try {
    const object = await getObject(file.filename)
    const body = await object.Body!.transformToString()

    // TODO: handle larger files; this is just a naive placeholder
    const content = body.slice(0, 10000)

    // TODO: handle non-text/markdown files like pdfs, images, and html
    // TODO: actual chunking, compute embeddings, and store in vector db
    return {
      file,
      content
    }
  } catch (err: any) {
    console.error('error fetching file', file.id, err.message)
    return null
  }
}
