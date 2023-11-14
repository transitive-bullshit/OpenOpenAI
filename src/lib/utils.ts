import type { Model } from '@dexaai/dexter/model'
import { Msg, type Prompt } from '@dexaai/dexter/prompt'
import { deepmerge as deepmergeInit } from '@fastify/deepmerge'
import type { Simplify } from 'type-fest'

import {
  type FluffyAssistantTools,
  type RunStepDetailsToolCallsObject
} from '~/generated/oai'

import '../prisma-json-types.d.ts'

export type OAITypeToPrismaType<T extends Record<string, unknown>> = Simplify<
  RequiredNonNullableObject<
    Omit<
      T,
      | 'created_at'
      | 'updated_at'
      | 'started_at'
      | 'cancelled_at'
      | 'completed_at'
      | 'expires_at'
      | 'failed_at'
    > &
      (T extends { created_at: number } ? { created_at: Date } : unknown) &
      (T extends { updated_at: number } ? { updated_at: Date } : unknown) &
      (T extends { started_at?: number } ? { started_at?: Date } : unknown) &
      (T extends { cancelled_at?: number }
        ? { cancelled_at?: Date }
        : unknown) &
      (T extends { completed_at?: number }
        ? { completed_at?: Date }
        : unknown) &
      (T extends { expires_at: number } ? { expires_at: Date } : unknown) &
      (T extends { failed_at: number } ? { failed_at: Date } : unknown)
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
      | 'completed_at'
      | 'expires_at'
      | 'failed_at'
    > &
      (T extends { created_at: Date } ? { created_at: number } : unknown) &
      (T extends { updated_at: Date } ? { updated_at: number } : unknown) &
      (T extends { started_at?: Date } ? { started_at?: number } : unknown) &
      (T extends { cancelled_at?: Date }
        ? { cancelled_at?: number }
        : unknown) &
      (T extends { completed_at?: Date }
        ? { completed_at?: number }
        : unknown) &
      (T extends { expires_at: Date } ? { expires_at: number } : unknown) &
      (T extends { failed_at: Date } ? { failed_at: number } : unknown)
  >
>

export type RequiredNonNullableObject<T extends object> = {
  [P in keyof Required<T>]: NonNullable<T[P]>
}

const dateKeys = [
  'created_at',
  'updated_at',
  'started_at',
  'cancelled_at',
  'completed_at',
  'expires_at',
  'failed_at'
]

export function convertPrismaToOAI<
  T extends Record<string, unknown>,
  U extends PrismaTypeToOAIType<T>
>(obj: T): U {
  obj = removeUndefinedAndNullValues(obj)

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

type DeepMerge = ReturnType<typeof deepmergeInit>
export const deepMerge: DeepMerge = deepmergeInit()
export const deepMergeArray: DeepMerge = deepmergeInit({
  mergeArray:
    (opts) =>
    (target: any[], source: any[]): any[] => {
      return target.map((value, index) => opts.deepmerge(value, source[index]))
    }
})

export function convertAssistantToolsToChatMessageTools(
  tools: FluffyAssistantTools[]
): Model.Chat.Config['tools'] {
  return tools.map((tool) => {
    switch (tool.type) {
      case 'function':
        return {
          type: 'function',
          function: tool.function!
        }

      case 'retrieval':
        return {
          type: 'function',
          function: {
            name: 'retrieval',
            description: 'TODO', // TODO
            parameters: {} // TODO
          }
        }

      case 'code_interpreter':
        return {
          type: 'function',
          function: {
            name: 'code_interpreter',
            description: 'TODO', // TODO
            parameters: {} // TODO
          }
        }

      default:
        throw new Error(`Invalid tool type: "${tool.type}"`)
    }
  })
}

export function convertAssistantToolCallsToChatMessage(
  toolCalls: RunStepDetailsToolCallsObject[]
): Prompt.Msg[] {
  return toolCalls.map((toolCall) => {
    switch (toolCall.type) {
      case 'function':
        return Msg.toolResult(toolCall.function!.output, toolCall.id)

      case 'code_interpreter':
        // TODO: handle 'image' code_interpreter outputs
        return Msg.toolResult(
          toolCall
            .code_interpreter!.outputs.filter((o) => o.type === 'logs')
            .map((o) => o.logs)
            .filter(Boolean)
            .join('\n\n'),
          toolCall.id
        )

      case 'retrieval':
        return Msg.toolResult(
          // TODO: use stringify helper from dexter
          JSON.stringify(toolCall.retrieval!.output, null, 2),
          toolCall.id
        )

      default:
        throw new Error(
          `Invalid tool call type: "${toolCall.type}" for tool call: "${toolCall.id}"`
        )
    }
  })
}
