import { OpenAPIHono } from '@hono/zod-openapi'

import * as routes from './generated/oai-routes'
import * as utils from './lib/utils'
import { prisma } from './lib/db'

const app: OpenAPIHono = new OpenAPIHono()

app.openapi(routes.listFiles, async (c) => {
  const { purpose } = c.req.valid('query')
  console.log('listFiles', { purpose })

  const res = await prisma.file.findMany({
    where: {
      purpose
    }
  })

  return c.jsonT({
    // TODO: this cast shouldn't be necessary
    data: res.map(utils.convertPrismaToOAI) as any,
    object: 'list' as const
  })
})

app.openapi(routes.createFile, async (c) => {
  const body = c.req.valid('form')
  console.log('createFile', { body })

  const { file, purpose } = body

  // TODO: process file and upload to blob store
  // TODO: extract file type and infer name
  // TODO: correct byte length

  const res = await prisma.file.create({
    data: {
      bytes: file.length,
      filename: 'TODO',
      status: 'uploaded',
      purpose
    }
  })

  // TODO: this cast shouldn't be necessary
  return c.jsonT(utils.convertPrismaToOAI(res) as any)
})

app.openapi(routes.deleteFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('deleteFile', { file_id })

  const res = await prisma.file.delete({
    where: {
      id: file_id
    }
  })

  return c.jsonT({
    deleted: true,
    id: res.id,
    object: 'file' as const
  })
})

app.openapi(routes.retrieveFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('retrieveFile', { file_id })

  const res = await prisma.file.findUniqueOrThrow({
    where: {
      id: file_id
    }
  })
  if (!res) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.downloadFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('downloadFile', { file_id })

  // TODO
  c.status(501)
  return null as any
})

export default app
