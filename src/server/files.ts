import { OpenAPIHono } from '@hono/zod-openapi'
import { sha256 } from 'crypto-hash'
import { fileTypeFromBuffer } from 'file-type'
import createHttpError from 'http-errors'

import * as routes from '~/generated/oai-routes'
import * as storage from '~/lib/storage'
import * as utils from '~/lib/utils'
import { prisma } from '~/lib/db'

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

  const fileAsBuffer = Buffer.from(file, 'binary')
  const fileType = await fileTypeFromBuffer(fileAsBuffer)
  const fileName = `${sha256(file)}${fileType?.ext ? `.${fileType.ext}` : ''}`
  const contentType = fileType?.mime || 'application/octet-stream'

  await storage.putObject(fileName, fileAsBuffer, {
    ContentType: contentType
  })

  const res = await prisma.file.create({
    data: {
      filename: fileName,
      status: 'uploaded',
      bytes: fileAsBuffer.byteLength,
      purpose
    }
  })
  if (!res) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(res))
})

app.openapi(routes.deleteFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('deleteFile', { file_id })

  const res = await prisma.file.delete({
    where: {
      id: file_id
    }
  })
  if (!res) return c.notFound() as any

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

  const res = await prisma.file.findUniqueOrThrow({
    where: {
      id: file_id
    }
  })
  if (!res) return c.notFound() as any

  const object = await storage.getObject(res.filename)
  // TODO: what encoding should we use here? it's not specified by the spec
  const body = await object.Body?.transformToString()
  if (!body) {
    throw createHttpError(500, 'Failed to retrieve file')
  }

  return c.json(body)
})

export default app
