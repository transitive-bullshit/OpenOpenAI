import type { JsonifiableObject } from 'type-fest'

import type * as oai from './generated/oai'

declare global {
  /**
   * This namespace allows us to customize generated Prisma types, which we use
   * for `Json` typing and literal string typing.
   *
   * @see https://github.com/arthurfiorette/prisma-json-types-generator
   */
  namespace PrismaJson {
    type Metadata = JsonifiableObject
    type Tool = oai.FluffyAssistantToolsSchema
    type MessageContent = oai.MessageContentObject
    type LastError = oai.FluffyLastError
    type RequiredAction = oai.RequiredAction
    type StepDetails = oai.StepDetails

    type AssistantObject = 'assistant'
    type AssistantFileObject = 'assistant.file'
    type FileObject = 'file'
    type ThreadObject = 'thread'
    type MessageObject = 'thread.message'
    type MessageFileObject = 'thread.message.file'
    type RunObject = 'thread.run'
    type RunStepObject = 'thread.run.step'
  }
}
