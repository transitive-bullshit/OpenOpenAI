import type * as prisma from '@prisma/client'
import type { z } from '@hono/zod-openapi'
import { describe, expectTypeOf, it } from 'vitest'

import type * as oai from './generated/oai'
import type { OAITypeToPrismaType, PrismaTypeToOAIType } from './utils'

describe('Assistant', () => {
  it('Assistant OAI to Prisma types', async () => {
    const oaiInput = {} as OAITypeToPrismaType<
      z.infer<typeof oai.AssistantObjectSchema>
    >
    const prismaOutput: prisma.Assistant = oaiInput
    expectTypeOf<typeof oaiInput>().toMatchTypeOf<typeof prismaOutput>()

    expectTypeOf<
      typeof oaiInput
    >().toMatchTypeOf<prisma.Prisma.AssistantCreateInput>()
  })

  it('Assistant Prisma types to OAI types', async () => {
    const prismaInput = {} as PrismaTypeToOAIType<prisma.Assistant>
    const oaiOutput: z.infer<typeof oai.AssistantObjectSchema> = prismaInput

    expectTypeOf<typeof prismaInput>().toMatchTypeOf<typeof oaiOutput>()
  })
})
