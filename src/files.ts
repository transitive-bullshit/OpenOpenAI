import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

import * as oai from './oai'

const app: OpenAPIHono = new OpenAPIHono()

const ListFilesResponseSchema =
  oai.ListFilesResponseSchema.openapi('ListFilesResponse')

const listFiles = createRoute({
  method: 'get',
  path: '',
  summary: 'Retrieve the user',
  request: {
    query: oai.ListFilesParamsQueryClassSchema
    // query: z.object({
    //   purpose: z.union([z.null(), z.string()]).optional()
    //   // .openapi({
    //   //   param: {
    //   //     in: 'query',
    //   //     name: 'purpose'
    //   //   }
    //   // })
    // })
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: ListFilesResponseSchema
        }
      }
    }
  }
})

app.openapi(listFiles, (c) => {
  // TODO: this should work
  // const { purpose } = c.req.valid('query')
  const purpose = c.req.query('purpose')
  console.log({ purpose })

  return c.jsonT({
    data: [],
    object: 'list' as const
  })
})

const CreateFileRequest =
  oai.CreateFileRequestSchema.openapi('CreateFileRequest')

const OpenAIFileSchema = oai.OpenAIFileClassSchema.openapi('OpenAIFile')

const createFile = createRoute({
  method: 'post',
  path: '',
  summary:
    'Upload a file that can be used across various endpoints/features. The size of all the files uploaded by one organization can be up to 100 GB.',
  request: {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: CreateFileRequest
        }
      }
    }
  },
  responses: {
    200: {
      description: 'OK',
      content: {
        'application/json': {
          schema: OpenAIFileSchema
        }
      }
    }
  }
})

app.openapi(createFile, (c) => {
  const body = c.req.valid('form')
  console.log(body)

  return c.jsonT({} as any)
})

export default app
