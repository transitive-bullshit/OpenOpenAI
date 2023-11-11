import { type Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export { prisma }
export type { Prisma }
