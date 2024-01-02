import type OpenAI from 'openai'

export type Assistant = OpenAI.Beta.Assistants.Assistant
export type AppAssistant = Assistant & { href: string }
export type AssistantFile = OpenAI.Beta.Assistants.AssistantFile
export type File = OpenAI.Files.FileObject
export type Message = OpenAI.Beta.Threads.Messages.ThreadMessage
export type MessageFile = OpenAI.Beta.Threads.Messages.MessageFile
export type Thread = OpenAI.Beta.Threads.Thread
export type Run = OpenAI.Beta.Threads.Runs.Run
export type RunStep = OpenAI.Beta.Threads.Runs.RunStep
