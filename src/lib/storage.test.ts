import { describe, expect, it } from 'vitest'

import * as storage from './storage'

describe('Storage', () => {
  it('putObject, getObject, deleteObject', async () => {
    if (!process.env.ACCESS_KEY_ID) {
      // TODO: ignore on CI
      expect(true).toEqual(true)
      return
    }

    await storage.putObject('test.txt', 'hello world', {
      ContentType: 'text/plain'
    })

    const obj = await storage.getObject('test.txt')
    expect(obj.ContentType).toEqual('text/plain')

    const body = await obj.Body?.transformToString()
    expect(body).toEqual('hello world')

    const res = await storage.deleteObject('test.txt')
    expect(res.$metadata.httpStatusCode).toEqual(204)
  })
})
