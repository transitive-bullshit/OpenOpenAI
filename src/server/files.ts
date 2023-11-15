import { OpenAPIHono } from '@hono/zod-openapi'
import { sha256 } from 'crypto-hash'
import { fileTypeFromBlob } from 'file-type'
import createHttpError from 'http-errors'

import * as routes from '~/generated/oai-routes'
import * as storage from '~/lib/storage'
import * as utils from '~/lib/utils'
import { prisma } from '~/lib/db'
import { processFileForAssistant } from '~/lib/retrieval'

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

  const { file: data, purpose } = body
  const dataAsFile = data as File
  const dataAsArrayBuffer = await dataAsFile.arrayBuffer()
  const dataAsUint8Array = new Uint8Array(dataAsArrayBuffer)

  const fileType = await fileTypeFromBlob(dataAsFile)
  const fileHash = await sha256(dataAsArrayBuffer)
  const fileName = `${fileHash}${
    dataAsFile.name
      ? `-${dataAsFile.name}`
      : fileType?.ext
      ? `.${fileType.ext}`
      : ''
  }`
  const contentType = fileType?.mime || 'application/octet-stream'

  const res = await storage.putObject(fileName, dataAsUint8Array, {
    ContentType: contentType
  })
  console.log('uploaded file', fileName, res)

  let file = await prisma.file.create({
    data: {
      filename: fileName,
      status: 'uploaded',
      bytes: dataAsArrayBuffer.byteLength,
      purpose
    }
  })
  if (!file) return c.notFound() as any

  if (purpose === 'assistants') {
    // Process file for assistant (knowledge retrieval pre-processing)
    await processFileForAssistant(file)

    if (file.status !== 'uploaded') {
      file = await prisma.file.update({
        where: { id: file.id },
        data: file
      })
    }
  }

  return c.jsonT(utils.convertPrismaToOAI(file))
})

app.openapi(routes.deleteFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('deleteFile', { file_id })

  const file = await prisma.file.delete({
    where: {
      id: file_id
    }
  })
  if (!file) return c.notFound() as any

  return c.jsonT({
    deleted: true,
    id: file.id,
    object: 'file' as const
  })
})

app.openapi(routes.retrieveFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('retrieveFile', { file_id })

  const file = await prisma.file.findUniqueOrThrow({
    where: {
      id: file_id
    }
  })
  if (!file) return c.notFound() as any

  return c.jsonT(utils.convertPrismaToOAI(file))
})

app.openapi(routes.downloadFile, async (c) => {
  const { file_id } = c.req.valid('param')
  console.log('downloadFile', { file_id })

  const file = await prisma.file.findUniqueOrThrow({
    where: {
      id: file_id
    }
  })
  if (!file) return c.notFound() as any

  const object = await storage.getObject(file.filename)
  // TODO: what encoding should we use here? it's not specified by the spec
  const body = await object.Body?.transformToString()
  if (!body) {
    throw createHttpError(500, 'Failed to retrieve file')
  }

  return c.json(body)
})

export default app
