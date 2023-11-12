import type { Simplify } from 'type-fest'

import '../prisma-json-types.d.ts'

export type OAITypeToPrismaType<T extends Record<string, unknown>> = Simplify<
  RequiredNonNullableObject<
    Omit<
      T,
      | 'created_at'
      | 'updated_at'
      | 'started_at'
      | 'cancelled_at'
      | 'expires_at'
      | 'failed_at'
    > &
      (T extends { created_at: number }
        ? T & { created_at: Date }
        : Omit<T, 'created_at'>) &
      (T extends { updated_at: number }
        ? T & { updated_at: Date }
        : Omit<T, 'updated_at'>) &
      (T extends { started_at: number }
        ? T & { started_at: number }
        : Omit<T, 'started_at'>) &
      (T extends { cancelled_at: number }
        ? T & { cancelled_at: number }
        : Omit<T, 'cancelled_at'>) &
      (T extends { expires_at: number }
        ? T & { expires_at: number }
        : Omit<T, 'expires_at'>) &
      (T extends { failed_at: number }
        ? T & { failed_at: number }
        : Omit<T, 'failed_at'>)
  >
>

export type PrismaTypeToOAIType<T extends Record<string, unknown>> = Simplify<
  RequiredNonNullableObject<
    Omit<
      T,
      | 'created_at'
      | 'updated_at'
      | 'started_at'
      | 'cancelled_at'
      | 'expires_at'
      | 'failed_at'
    > &
      (T extends { created_at: Date }
        ? T & { created_at: number }
        : Omit<T, 'created_at'>) &
      (T extends { updated_at: Date }
        ? T & { updated_at: number }
        : Omit<T, 'updated_at'>) &
      (T extends { started_at: Date }
        ? T & { started_at: number }
        : Omit<T, 'started_at'>) &
      (T extends { cancelled_at: Date }
        ? T & { cancelled_at: number }
        : Omit<T, 'cancelled_at'>) &
      (T extends { expires_at: Date }
        ? T & { expires_at: number }
        : Omit<T, 'expires_at'>) &
      (T extends { failed_at: Date }
        ? T & { failed_at: number }
        : Omit<T, 'failed_at'>)
  >
>

export type RequiredNonNullableObject<T extends object> = {
  [P in keyof Required<T>]: NonNullable<T[P]>
}

export function convertPrismaToOAI<
  T extends Record<string, unknown>,
  U extends PrismaTypeToOAIType<T>
>(obj: T): U {
  obj = removeUndefinedAndNullValues(obj)

  const dateKeys = [
    'created_at',
    'updated_at',
    'started_at',
    'cancelled_at',
    'expires_at',
    'failed_at'
  ]

  for (const key of dateKeys) {
    if (key in obj && obj[key] instanceof Date) {
      ;(obj as any)[key] = ((obj[key] as Date).getTime() / 1000) | 0
    }
  }

  return obj as unknown as U
}

export function convertOAIToPrisma<
  T extends Record<string, unknown>,
  U extends OAITypeToPrismaType<T>
>(obj: T): U {
  obj = removeUndefinedAndNullValues(obj)

  const dateKeys = [
    'created_at',
    'updated_at',
    'started_at',
    'cancelled_at',
    'expires_at',
    'failed_at'
  ]

  for (const key of dateKeys) {
    if (key in obj && obj[key]) {
      ;(obj as any)[key] = new Date(obj[key] as number)
    }
  }

  return obj as unknown as U
}

export function removeUndefinedAndNullValues<T extends Record<string, unknown>>(
  obj: T
): RequiredNonNullableObject<T> {
  Object.keys(obj).forEach(
    (key) => (obj[key] === undefined || obj[key] === null) && delete obj[key]
  )
  return obj as RequiredNonNullableObject<T>
}

export function getPrismaFindManyParams({
  after,
  before,
  limit,
  order,
  defaultLimit = 10
}: {
  after?: string
  before?: string
  limit?: string
  order?: string
  defaultLimit?: number
} = {}) {
  const takeTemp = parseInt(limit ?? '', 10)
  const take = isNaN(takeTemp) ? defaultLimit : takeTemp

  const params: any = {
    take,
    orderBy: {
      created_at: order || 'desc'
    }
  }

  if (after) {
    params.cursor = {
      id: after
    }
    params.skip = 1
  }

  if (before) {
    params.where = {
      id: {
        lt: before
      }
    }
  }

  return params
}

export function getPaginatedObject<
  T extends Record<string, unknown> & { id: string }
>(data: T[], params: any) {
  return {
    data: data.map(convertPrismaToOAI),
    first_id: data[0]?.id,
    last_id: data[data.length - 1]?.id,
    has_more: data.length >= params.take,
    object: 'list' as const
  }
}
