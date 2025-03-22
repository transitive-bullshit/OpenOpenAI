import fs from 'node:fs/promises'

import * as prettier from 'prettier'
import SwaggerParser from '@apidevtools/swagger-parser'
import { convertParametersToJSONSchema } from 'openapi-jsonschema-parameters'
import type { OpenAPIV3 } from 'openapi-types'
import {
  FetchingJSONSchemaStore,
  InputData,
  JSONSchemaInput,
  quicktype
} from 'quicktype-core'

const srcFile = './openai-openapi/openapi.yaml'
const destFolder = './src/generated'
const destFileSchemas = `${destFolder}/oai.ts`
const destfileRoutes = `${destFolder}/oai-routes.ts`

const jsonContentType = 'application/json'
const multipartFormData = 'multipart/form-data'

const header = `/**
 * This file is auto-generated by OpenOpenAI using OpenAI's OpenAPI spec as a
 * source of truth.
 *
 * DO NOT EDIT THIS FILE MANUALLY if you want your changes to persist.
 */`

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
  const parser = new SwaggerParser()
  const spec = (await parser.bundle(srcFile)) as OpenAPIV3.Document

  if (spec.openapi !== '3.0.0') {
    console.error(`Unexpected OpenAI OpenAPI version "${spec.openapi}"`)
    console.error('The OpenAI API likely received a major update.')
    process.exit(1)
  }

  const pathsToProcess: string[] = []

  for (const path in spec.paths) {
    // if (!path.startsWith('/threads/{thread_id}/messages')) continue // TODO

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

  // console.log(pathsToProcess)

  const componentsToProcess = new Set<string>()
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore())

  const subpaths = [
    ['responses', '200', 'content', jsonContentType, 'schema'],
    ['requestBody', 'content', jsonContentType, 'schema'],
    ['requestBody', 'content', multipartFormData, 'schema']
  ]

  for (const path of pathsToProcess) {
    const pathItem = spec.paths[path]
    if (!pathItem) {
      throw new Error()
    }

    // console.log(JSON.stringify(pathItem, null, 2))

    const httpMethods = Object.keys(pathItem)
    for (const httpMethod of httpMethods) {
      const operation = pathItem[httpMethod]

      for (const subpath of subpaths) {
        const resolved = new Set<string>()
        getAndResolve(operation, subpath, parser.$refs, resolved)

        for (const ref of resolved) {
          componentsToProcess.add(ref)
        }
      }

      if (operation.parameters) {
        const name = `${titleCase(operation.operationId)}Params`
        const params = convertParametersToJSONSchema(operation.parameters)

        if (params.body) {
          const schema = JSON.stringify(
            dereference(params.body, parser.$refs),
            null,
            2
          )
          // console.log(name, 'body', schema)
          await schemaInput.addSource({
            name: `${name}Body`,
            schema
          })
        }

        if (params.formData) {
          const schema = JSON.stringify(
            dereference(params.formData, parser.$refs),
            null,
            2
          )
          // console.log(name, 'formData', schema)
          await schemaInput.addSource({
            name: `${name}FormData`,
            schema
          })
        }

        if (params.headers) {
          const schema = JSON.stringify(
            dereference(params.headers, parser.$refs),
            null,
            2
          )
          // console.log(name, 'headers', schema)
          await schemaInput.addSource({
            name: `${name}Headers`,
            schema
          })
        }

        if (params.path) {
          const schema = JSON.stringify(
            dereference(params.path, parser.$refs),
            null,
            2
          )
          // console.log(name, 'path', schema)
          await schemaInput.addSource({
            name: `${name}Path`,
            schema
          })
        }

        if (params.query) {
          const schema = JSON.stringify(
            dereference(params.query, parser.$refs),
            null,
            2
          )
          // console.log(name, 'query', schema)
          await schemaInput.addSource({
            name: `${name}Query`,
            schema
          })
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

    // console.log(ref, name, dereferenced)
    await schemaInput.addSource({
      name,
      schema: JSON.stringify(dereferenced, null, 2)
    })
  }

  const inputData = new InputData()
  inputData.addInput(schemaInput)

  const generatedSource = await quicktype({
    inputData,
    lang: 'TypeScript Zod'
    // combineClasses: true
  })

  const schemasSource = [header]
    .concat(generatedSource.lines)
    .join('\n')
    .replace(
      'import * as z from "zod"',
      "import { z } from '@hono/zod-openapi'"
    )
    .replaceAll(/OpenAi/g, 'OpenAI')
    // remove inferred types, as we don't use them
    // .replaceAll(/^.* = z.infer<[^>]*>;?$/gm, '')
    .trim()

  const prettySchemasSource0 = prettify(schemasSource)
    // simplify a lot of the unnecessary nullable unions
    .replaceAll(/z\s*\.union\(\[\s*z\.null\(\),\s*([^\]]*)\s*\]\)/gm, '$1')
    .replaceAll(/z\s*\.union\(\[\s*([^,]*),\s*z\.null\(\)\s*\]\)/gm, '$1')
    // replace single value enums with literals
    .replaceAll(/z\s*\.enum\(\[\s*('[^']*')\s*\]\)/gm, 'z.literal($1)')
    // temporary bug fix for zod-openapi not recognizing numbers in query params
    .replaceAll('limit: z.number().optional()', 'limit: z.string().optional()')
    // fix for [CreateFileRequestSchema](https://github.com/openai/openai-openapi/issues/123)
    .replace(/\bfile: z.string\(\)/, 'file: z.any()')

  const prettySchemasSource = prettify(prettySchemasSource0)
  await fs.writeFile(destFileSchemas, prettySchemasSource)

  // ---------------------------------------------------------------------------

  // QuickType will sometimes rename schemas for various reasons, so we need to
  // keep these identifiers in order to resolve them later.
  const renamedSchemas = new Set<string>(
    prettySchemasSource
      .match(/export const (.*)ClassSchema =/g)
      ?.map((line) => line.replace(/export const (.*)ClassSchema =/, '$1'))
  )

  function resolveSchemaName(name: string) {
    return renamedSchemas.has(name) ? `${name}ClassSchema` : `${name}Schema`
  }

  // NOTE: We're looping through the paths a second time here to handle route
  // info, because we can only do so after we've resolved the generated schema
  // names via QuickType.
  const routesOutput: string[] = []

  for (const path of pathsToProcess) {
    const pathItem = spec.paths[path]
    if (!pathItem) {
      throw new Error()
    }

    const httpMethods = Object.keys(pathItem)
    for (const httpMethod of httpMethods) {
      const operation = pathItem[httpMethod]
      const createRouteParams: any = {
        method: httpMethod,
        path,
        summary: operation.summary,
        description: operation.description,
        request: {},
        responses: {}
      }

      for (const subpath of subpaths) {
        const resolved = new Set<string>()
        const resolvedOperation = getAndResolve(
          operation,
          subpath,
          parser.$refs,
          resolved
        )

        if (!resolvedOperation || !resolved.size) continue
        const ref = Array.from(resolved)[0]
        const shortName = ref.split('/').pop()!
        const name = resolveSchemaName(shortName)

        if (subpath[0] === 'responses') {
          createRouteParams.responses = {
            ...createRouteParams.responses,
            [subpath[1]]: {
              description: resolvedOperation.responses[subpath[1]].description,
              [subpath[2]]: {
                [subpath[3]]: {
                  [subpath[4]]: `oai.${name}.openapi('${shortName}')`
                }
              }
            }
          }
        } else if (subpath[0] === 'requestBody') {
          createRouteParams.request.body = {
            description: resolvedOperation.requestBody.description,
            required: resolvedOperation.requestBody.required,
            [subpath[1]]: {
              [subpath[2]]: {
                [subpath[3]]: `oai.${name}.openapi('${shortName}')`
              }
            }
          }
        }
      }

      if (operation.parameters) {
        const namePrefix = `${titleCase(operation.operationId)}Params`
        const params = convertParametersToJSONSchema(operation.parameters)

        if (params.body) {
          const schema = JSON.stringify(
            dereference(params.body, parser.$refs),
            null,
            2
          )
          // console.log(namePrefix, 'body', schema)
          await schemaInput.addSource({
            name: `${namePrefix}Body`,
            schema
          })

          const name = resolveSchemaName(`${namePrefix}Body`)
          createRouteParams.request.body = `oai.${name}`
        }

        if (params.formData) {
          const schema = JSON.stringify(
            dereference(params.formData, parser.$refs),
            null,
            2
          )
          // console.log(namePrefix, 'formData', schema)
          await schemaInput.addSource({
            name: `${namePrefix}FormData`,
            schema
          })

          // TODO: this seems unsupported in zod-to-openapi
          // const name = resolveSchemaName(`${namePrefix}FormData`)
          // createRouteParams.request.body = `oai.${name}`
        }

        if (params.headers) {
          const schema = JSON.stringify(
            dereference(params.headers, parser.$refs),
            null,
            2
          )
          // console.log(namePrefix, 'headers', schema)
          await schemaInput.addSource({
            name: `${namePrefix}Headers`,
            schema
          })

          const name = resolveSchemaName(`${namePrefix}Headers`)
          createRouteParams.request.headers = `oai.${name}`
        }

        if (params.path) {
          const schema = JSON.stringify(
            dereference(params.path, parser.$refs),
            null,
            2
          )
          // console.log(namePrefix, 'path', schema)
          await schemaInput.addSource({
            name: `${namePrefix}Path`,
            schema
          })

          const name = resolveSchemaName(`${namePrefix}Path`)
          createRouteParams.request.params = `oai.${name}`
        }

        if (params.query) {
          const schema = JSON.stringify(
            dereference(params.query, parser.$refs),
            null,
            2
          )
          // console.log(namePrefix, 'query', schema)
          await schemaInput.addSource({
            name: `${namePrefix}Query`,
            schema
          })

          const name = resolveSchemaName(`${namePrefix}Query`)
          createRouteParams.request.query = `oai.${name}`
        }
      }

      const routeOutput = `export const ${
        operation.operationId
      } = createRoute(${JSON.stringify(createRouteParams, null, 2)})`
        .replaceAll(/"(oai\.[^"]*)"/g, '$1')
        .replaceAll(/'(oai\.[^']*)'/g, '$1')

      // ListFilesParamsQuery => ListFilesParamsQueryClassSchema
      routesOutput.push(routeOutput)
    }
  }

  const routesSource = [
    header,
    "import { createRoute } from '@hono/zod-openapi'",
    "import * as oai from './oai'"
  ]
    .concat(routesOutput)
    .join('\n\n')
  const prettyRoutesSource = prettify(routesSource)
  await fs.writeFile(destfileRoutes, prettyRoutesSource)
}

function prettify(source: string): string {
  return prettier.format(source, {
    parser: 'typescript',
    semi: false,
    singleQuote: true,
    jsxSingleQuote: true,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    trailingComma: 'none'
  })
}

function titleCase(identifier: string): string {
  return `${identifier.slice(0, 1).toUpperCase()}${identifier.slice(1)}`
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

  const resolvedValue = getAndResolve(value, keys, refs, resolved)
  return {
    ...obj,
    [key]: resolvedValue
  }
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
      const ref = obj.$ref as string
      const derefed = refs.get(ref as string)
      if (!derefed) {
        return obj
      }
      resolved?.add(ref)
      derefed.title = ref.split('/').pop()!
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
