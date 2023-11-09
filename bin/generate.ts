import fs from 'node:fs/promises'

import * as prettier from 'prettier'
import SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPIV3 } from 'openapi-types'
import {
  FetchingJSONSchemaStore,
  InputData,
  JSONSchemaInput,
  quicktype
} from 'quicktype-core'

const jsonContentType = 'application/json'

// Notes:
// `json-schema-to-zod` doesn't seem to output subtypes
// `quicktype` doesn't seem to output zod .describes

// The subset of API paths that we care about, which determines the subset of types
// that we need to generate.
const openaiOpenAPIPaths: Record<string, boolean> = {
  '/chat/completions': false,
  '/completions': false,
  '/edits': false,
  '/images/generations': false,
  '/images/edits': false,
  '/images/variations': false,
  '/embeddings': false,
  '/audio/speech': false,
  '/audio/transcriptions': false,
  '/audio/translations': false,
  '/files': true,
  '/files/{file_id}': true,
  '/files/{file_id}/content': true,
  '/fine_tuning/jobs': false,
  '/fine_tuning/jobs/{fine_tuning_job_id}': false,
  '/fine_tuning/jobs/{fine_tuning_job_id}/events': false,
  '/fine_tuning/jobs/{fine_tuning_job_id}/cancel': false,
  '/fine-tunes': false,
  '/fine-tunes/{fine_tune_id}': false,
  '/fine-tunes/{fine_tune_id}/cancel': false,
  '/fine-tunes/{fine_tune_id}/events': false,
  '/models': false,
  '/models/{model}': false,
  '/moderations': false,
  '/assistants': true,
  '/assistants/{assistant_id}': true,
  '/threads': true,
  '/threads/{thread_id}': true,
  '/threads/{thread_id}/messages': true,
  '/threads/{thread_id}/messages/{message_id}': true,
  '/threads/runs': true,
  '/threads/{thread_id}/runs': true,
  '/threads/{thread_id}/runs/{run_id}': true,
  '/threads/{thread_id}/runs/{run_id}/submit_tool_outputs': true,
  '/threads/{thread_id}/runs/{run_id}/cancel': true,
  '/threads/{thread_id}/runs/{run_id}/steps': true,
  '/threads/{thread_id}/runs/{run_id}/steps/{step_id}': true,
  '/assistants/{assistant_id}/files': true,
  '/assistants/{assistant_id}/files/{file_id}': true,
  '/threads/{thread_id}/messages/{message_id}/files': true,
  '/threads/{thread_id}/messages/{message_id}/files/{file_id}': true
}

async function main() {
  const srcFile = './openai-openapi/openapi.yaml'
  const destFile = './src/generated-types.ts'

  const parser = new SwaggerParser()
  const spec = (await parser.bundle(srcFile)) as OpenAPIV3.Document

  if (spec.openapi !== '3.0.0') {
    console.error(`Unexpected OpenAI OpenAPI version "${spec.openapi}"`)
    console.error('The OpenAI API likely received a major update.')
    process.exit(1)
  }

  const pathsToProcess: string[] = []

  for (const path in spec.paths) {
    const openaiOpenAPIPath = openaiOpenAPIPaths[path]
    if (openaiOpenAPIPath === undefined) {
      console.error(`Unexpected OpenAI OpenAPI path: ${path}`)
      console.error('The OpenAI API likely received a major update.')
      process.exit(1)
    }

    if (openaiOpenAPIPath) {
      pathsToProcess.push(path)
    }
  }

  for (const path of Object.keys(openaiOpenAPIPaths)) {
    if (!spec.paths[path]) {
      console.error(`Missing expected OpenAI OpenAPI path: ${path}`)
      console.error('The OpenAI API likely received a major update.')
      process.exit(1)
    }
  }

  const componentsToProcess = new Set<string>()

  for (const path of pathsToProcess) {
    const pathItem = spec.paths[path]
    if (!pathItem) {
      throw new Error()
    }

    // console.log(JSON.stringify(pathItem, null, 2))

    const httpMethods = Object.keys(pathItem)
    for (const httpMethod of httpMethods) {
      const operation = pathItem[httpMethod]
      const paths = [
        ['responses', '200', 'content', jsonContentType, 'schema'],
        ['requestBody', 'content', jsonContentType, 'schema'],
        ['requestBody', 'content', 'multipart/form-data', 'schema']
      ]
      for (const path of paths) {
        const resolved = new Set<string>()
        getAndResolve(operation, path, parser.$refs, resolved)

        for (const ref of resolved) {
          componentsToProcess.add(ref)
        }
      }
    }
  }

  const componentNames = Array.from(componentsToProcess)
    .map((ref) => ref.split('/').pop())
    .sort()
  console.log(componentNames)
  console.log()

  const proccessedComponents = new Set<string>()
  const componentToRefs: Record<
    string,
    { dereferenced: any; refs: Set<string> }
  > = {}

  for (const ref of componentsToProcess) {
    const component = parser.$refs.get(ref)
    if (!component) continue // TODO

    const resolved = new Set<string>()
    const dereferenced = dereference(component, parser.$refs, resolved)
    if (!dereferenced) continue // TODO

    componentToRefs[ref] = { dereferenced, refs: resolved }
  }

  const sortedComponents = Object.keys(componentToRefs).sort(
    (a, b) => componentToRefs[b].refs.size - componentToRefs[a].refs.size
  )

  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

  for (const ref of sortedComponents) {
    const name = ref.split('/').pop()!
    if (!name) throw new Error()

    const { dereferenced, refs } = componentToRefs[ref]
    if (proccessedComponents.has(ref)) {
      continue
    }

    for (const r of refs) {
      if (proccessedComponents.has(r)) {
        continue
      }

      proccessedComponents.add(r)
    }

    proccessedComponents.add(ref)

    await schemaInput.addSource({
      name,
      schema: JSON.stringify(dereferenced, null, 2)
    })
  }

  const inputData = new InputData()
  inputData.addInput(schemaInput)

  const res = await quicktype({
    inputData,
    lang: 'TypeScript Zod'
  })

  const output = res.lines
    .join('\n')
    .replaceAll(/OpenAi/g, 'OpenAI')
    .trim()

  const prettyOutput = prettier.format(output, {
    parser: 'typescript',
    semi: false,
    singleQuote: true,
    jsxSingleQuote: true,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    trailingComma: 'none'
  })

  await fs.writeFile(destFile, prettyOutput)
}

function getAndResolve<T extends any = any>(
  obj: any,
  keys: string[],
  refs: SwaggerParser.$Refs,
  resolved?: Set<string>
): T | null {
  if (obj === undefined) return null
  if (typeof obj !== 'object') return null
  if (obj.$ref) {
    const derefed = refs.get(obj.$ref)
    resolved?.add(obj.$ref)
    if (!derefed) {
      return null
    }
    obj = derefed
  }

  if (!keys.length) {
    return dereference(obj, refs, resolved) as T
  }

  const key = keys[0]
  const value = obj[key]
  keys = keys.slice(1)
  if (value === undefined) {
    return null
  }

  return getAndResolve(value, keys, refs, resolved)
}

function dereference<T extends any = any>(
  obj: T,
  refs: SwaggerParser.$Refs,
  resolved?: Set<string>
): T {
  if (!obj) return obj

  if (Array.isArray(obj)) {
    return obj.map((item) => dereference(item, refs, resolved)) as T
  } else if (typeof obj === 'object') {
    if ('$ref' in obj) {
      const derefed = refs.get(obj.$ref as string)
      if (!derefed) {
        return obj
      }
      resolved?.add(obj.$ref as string)
      return dereference(derefed, refs, resolved)
    } else {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          dereference(value, refs, resolved)
        ])
      ) as T
    }
  } else {
    return obj
  }
}

main()
