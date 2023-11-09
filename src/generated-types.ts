import * as z from 'zod'

// One of `server_error` or `rate_limit_exceeded`.

export const CodeSchema = z.enum(['rate_limit_exceeded', 'server_error'])
export type Code = z.infer<typeof CodeSchema>

// The object type, which is always `thread.run.step``.

export const PurpleObjectSchema = z.enum(['thread.run.step'])
export type PurpleObject = z.infer<typeof PurpleObjectSchema>

// The status of the run step, which can be either `in_progress`, `cancelled`, `failed`,
// `completed`, or `expired`.

export const PurpleStatusSchema = z.enum([
  'cancelled',
  'completed',
  'expired',
  'failed',
  'in_progress'
])
export type PurpleStatus = z.infer<typeof PurpleStatusSchema>

// Always `logs`.
//
// Always `image`.

export const OutputTypeSchema = z.enum(['image', 'logs'])
export type OutputType = z.infer<typeof OutputTypeSchema>

// The type of tool call. This is always going to be `code_interpreter` for this type of
// tool call.
//
// The type of tool call. This is always going to be `retrieval` for this type of tool
// call.
//
// The type of tool call. This is always going to be `function` for this type of tool call.
//
// The type of tool being defined: `code_interpreter`
//
// The type of tool being defined: `retrieval`
//
// The type of tool being defined: `function`

export const ToolTypeSchema = z.enum([
  'code_interpreter',
  'function',
  'retrieval'
])
export type ToolType = z.infer<typeof ToolTypeSchema>

// Always `message_creation``.
//
// Always `tool_calls`.
//
// The type of run step, which can be either `message_creation` or `tool_calls`.

export const StepDetailsTypeSchema = z.enum(['message_creation', 'tool_calls'])
export type StepDetailsType = z.infer<typeof StepDetailsTypeSchema>

// The role of the entity that is creating the message. Currently only `user` is supported.

export const MessageRoleSchema = z.enum(['user'])
export type MessageRole = z.infer<typeof MessageRoleSchema>

// The object type, which is always `thread.run`.

export const FluffyObjectSchema = z.enum(['thread.run'])
export type FluffyObject = z.infer<typeof FluffyObjectSchema>

// The type of tool call the output is required for. For now, this is always `function`.

export const PurpleTypeSchema = z.enum(['function'])
export type PurpleType = z.infer<typeof PurpleTypeSchema>

// For now, this is always `submit_tool_outputs`.

export const RequiredActionTypeSchema = z.enum(['submit_tool_outputs'])
export type RequiredActionType = z.infer<typeof RequiredActionTypeSchema>

// The status of the run, which can be either `queued`, `in_progress`, `requires_action`,
// `cancelling`, `cancelled`, `failed`, `completed`, or `expired`.

export const FluffyStatusSchema = z.enum([
  'cancelled',
  'cancelling',
  'completed',
  'expired',
  'failed',
  'in_progress',
  'queued',
  'requires_action'
])
export type FluffyStatus = z.infer<typeof FluffyStatusSchema>

// The object type, which is always `assistant`.

export const TentacledObjectSchema = z.enum(['assistant'])
export type TentacledObject = z.infer<typeof TentacledObjectSchema>

// Always `file_citation`.
//
// Always `file_path`.

export const AnnotationTypeSchema = z.enum(['file_citation', 'file_path'])
export type AnnotationType = z.infer<typeof AnnotationTypeSchema>

// Always `image_file`.
//
// Always `text`.

export const ContentTypeSchema = z.enum(['image_file', 'text'])
export type ContentType = z.infer<typeof ContentTypeSchema>

// The object type, which is always `thread.message`.

export const StickyObjectSchema = z.enum(['thread.message'])
export type StickyObject = z.infer<typeof StickyObjectSchema>

// The entity that produced the message. One of `user` or `assistant`.

export const DatumRoleSchema = z.enum(['assistant', 'user'])
export type DatumRole = z.infer<typeof DatumRoleSchema>

// The object type, which is always `file`.

export const OpenAIFileObjectSchema = z.enum(['file'])
export type OpenAIFileObject = z.infer<typeof OpenAIFileObjectSchema>

// The intended purpose of the file. Supported values are `fine-tune`, `fine-tune-results`,
// `assistants`, and `assistants_output`.

export const OpenAIFilePurposeSchema = z.enum([
  'assistants',
  'assistants_output',
  'fine-tune',
  'fine-tune-results'
])
export type OpenAIFilePurpose = z.infer<typeof OpenAIFilePurposeSchema>

// Deprecated. The current status of the file, which can be either `uploaded`, `processed`,
// or `error`.

export const OpenAIFileStatusSchema = z.enum(['error', 'processed', 'uploaded'])
export type OpenAIFileStatus = z.infer<typeof OpenAIFileStatusSchema>

export const ListFilesResponseObjectSchema = z.enum(['list'])
export type ListFilesResponseObject = z.infer<
  typeof ListFilesResponseObjectSchema
>

// The object type, which is always `assistant.file`.

export const IndigoObjectSchema = z.enum(['assistant.file'])
export type IndigoObject = z.infer<typeof IndigoObjectSchema>

// The object type, which is always `thread.message.file`.

export const IndecentObjectSchema = z.enum(['thread.message.file'])
export type IndecentObject = z.infer<typeof IndecentObjectSchema>

// The intended purpose of the uploaded file.
//
// Use "fine-tune" for [Fine-tuning](/docs/api-reference/fine-tuning) and "assistants" for
// [Assistants](/docs/api-reference/assistants) and
// [Messages](/docs/api-reference/messages). This allows us to validate the format of the
// uploaded file is correct for fine-tuning.

export const CreateFileRequestPurposeSchema = z.enum([
  'assistants',
  'fine-tune'
])
export type CreateFileRequestPurpose = z.infer<
  typeof CreateFileRequestPurposeSchema
>

export const DeleteAssistantResponseObjectSchema = z.enum(['assistant.deleted'])
export type DeleteAssistantResponseObject = z.infer<
  typeof DeleteAssistantResponseObjectSchema
>

// The object type, which is always `thread`.

export const ThreadObjectSchema = z.enum(['thread'])
export type ThreadObject = z.infer<typeof ThreadObjectSchema>

export const DeleteThreadResponseObjectSchema = z.enum(['thread.deleted'])
export type DeleteThreadResponseObject = z.infer<
  typeof DeleteThreadResponseObjectSchema
>

export const DeleteAssistantFileResponseObjectSchema = z.enum([
  'assistant.file.deleted'
])
export type DeleteAssistantFileResponseObject = z.infer<
  typeof DeleteAssistantFileResponseObjectSchema
>

export const DeleteAssistantFileResponseSchema = z.object({
  deleted: z.boolean(),
  id: z.string(),
  object: DeleteAssistantFileResponseObjectSchema
})
export type DeleteAssistantFileResponse = z.infer<
  typeof DeleteAssistantFileResponseSchema
>

export const CreateAssistantFileRequestSchema = z.object({
  file_id: z.string()
})
export type CreateAssistantFileRequest = z.infer<
  typeof CreateAssistantFileRequestSchema
>

export const ToolOutputSchema = z.object({
  output: z.union([z.null(), z.string()]).optional(),
  tool_call_id: z.union([z.null(), z.string()]).optional()
})
export type ToolOutput = z.infer<typeof ToolOutputSchema>

export const SubmitToolOutputsRunRequestSchema = z.object({
  tool_outputs: z.array(ToolOutputSchema)
})
export type SubmitToolOutputsRunRequest = z.infer<
  typeof SubmitToolOutputsRunRequestSchema
>

export const ModifyRunRequestSchema = z.object({
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional()
})
export type ModifyRunRequest = z.infer<typeof ModifyRunRequestSchema>

export const ModifyMessageRequestSchema = z.object({
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional()
})
export type ModifyMessageRequest = z.infer<typeof ModifyMessageRequestSchema>

export const DeleteThreadResponseSchema = z.object({
  deleted: z.boolean(),
  id: z.string(),
  object: DeleteThreadResponseObjectSchema
})
export type DeleteThreadResponse = z.infer<typeof DeleteThreadResponseSchema>

export const ModifyThreadRequestSchema = z.object({
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional()
})
export type ModifyThreadRequest = z.infer<typeof ModifyThreadRequestSchema>

export const ThreadSchema = z.object({
  created_at: z.number(),
  id: z.string(),
  metadata: z.record(z.string(), z.any()),
  object: ThreadObjectSchema
})
export type Thread = z.infer<typeof ThreadSchema>

export const DeleteAssistantResponseSchema = z.object({
  deleted: z.boolean(),
  id: z.string(),
  object: DeleteAssistantResponseObjectSchema
})
export type DeleteAssistantResponse = z.infer<
  typeof DeleteAssistantResponseSchema
>

export const DeleteFileResponseSchema = z.object({
  deleted: z.boolean(),
  id: z.string(),
  object: OpenAIFileObjectSchema
})
export type DeleteFileResponse = z.infer<typeof DeleteFileResponseSchema>

export const CreateFileRequestSchema = z.object({
  file: z.string(),
  purpose: CreateFileRequestPurposeSchema
})
export type CreateFileRequest = z.infer<typeof CreateFileRequestSchema>

export const MessageFilesSchema = z.object({
  created_at: z.number(),
  id: z.string(),
  message_id: z.string(),
  object: IndecentObjectSchema
})
export type MessageFiles = z.infer<typeof MessageFilesSchema>

export const ListMessageFilesResponseClassSchema = z.object({
  data: z.array(MessageFilesSchema),
  first_id: z.string(),
  has_more: z.boolean(),
  last_id: z.string(),
  object: z.string(),
  items: z.any()
})
export type ListMessageFilesResponseClass = z.infer<
  typeof ListMessageFilesResponseClassSchema
>

export const AssistantFilesSchema = z.object({
  assistant_id: z.string(),
  created_at: z.number(),
  id: z.string(),
  object: IndigoObjectSchema
})
export type AssistantFiles = z.infer<typeof AssistantFilesSchema>

export const ListAssistantFilesResponseClassSchema = z.object({
  data: z.array(AssistantFilesSchema),
  first_id: z.string(),
  has_more: z.boolean(),
  last_id: z.string(),
  object: z.string(),
  items: z.any()
})
export type ListAssistantFilesResponseClass = z.infer<
  typeof ListAssistantFilesResponseClassSchema
>

export const OpenAIFileClassSchema = z.object({
  bytes: z.number(),
  created_at: z.number(),
  filename: z.string(),
  id: z.string(),
  object: OpenAIFileObjectSchema,
  purpose: OpenAIFilePurposeSchema,
  status: OpenAIFileStatusSchema,
  status_details: z.union([z.null(), z.string()]).optional()
})
export type OpenAIFileClass = z.infer<typeof OpenAIFileClassSchema>

export const ListFilesResponseSchema = z.object({
  data: z.array(
    z.union([
      z.array(z.any()),
      z.boolean(),
      OpenAIFileClassSchema,
      z.number(),
      z.number(),
      z.null(),
      z.string()
    ])
  ),
  object: ListFilesResponseObjectSchema
})
export type ListFilesResponse = z.infer<typeof ListFilesResponseSchema>

export const AmbitiousFunctionSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  name: z.string(),
  parameters: z.record(z.string(), z.any())
})
export type AmbitiousFunction = z.infer<typeof AmbitiousFunctionSchema>

export const CreateRunRequestToolSchema = z.object({
  type: ToolTypeSchema,
  function: z.union([AmbitiousFunctionSchema, z.null()]).optional()
})
export type CreateRunRequestTool = z.infer<typeof CreateRunRequestToolSchema>

export const CreateRunRequestSchema = z.object({
  assistant_id: z.string(),
  instructions: z.union([z.null(), z.string()]).optional(),
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  model: z.union([z.null(), z.string()]).optional(),
  tools: z.union([z.array(CreateRunRequestToolSchema), z.null()]).optional()
})
export type CreateRunRequest = z.infer<typeof CreateRunRequestSchema>

export const FilePathSchema = z.object({
  file_id: z.string()
})
export type FilePath = z.infer<typeof FilePathSchema>

export const FileCitationSchema = z.object({
  file_id: z.string(),
  quote: z.string()
})
export type FileCitation = z.infer<typeof FileCitationSchema>

export const FileSchema = z.object({
  end_index: z.number(),
  file_citation: z.union([FileCitationSchema, z.null()]).optional(),
  start_index: z.number(),
  text: z.string(),
  type: AnnotationTypeSchema,
  file_path: z.union([FilePathSchema, z.null()]).optional()
})
export type File = z.infer<typeof FileSchema>

export const TextSchema = z.object({
  annotations: z.array(FileSchema),
  value: z.string()
})
export type Text = z.infer<typeof TextSchema>

export const ImageFileClassSchema = z.object({
  file_id: z.string()
})
export type ImageFileClass = z.infer<typeof ImageFileClassSchema>

export const ContentElementSchema = z.object({
  image_file: z.union([ImageFileClassSchema, z.null()]).optional(),
  type: ContentTypeSchema,
  text: z.union([TextSchema, z.null()]).optional()
})
export type ContentElement = z.infer<typeof ContentElementSchema>

export const TheMessageObjectSchema = z.object({
  assistant_id: z.string(),
  content: z.array(ContentElementSchema),
  created_at: z.number(),
  file_ids: z.array(z.string()),
  id: z.string(),
  metadata: z.record(z.string(), z.any()),
  object: StickyObjectSchema,
  role: DatumRoleSchema,
  run_id: z.string(),
  thread_id: z.string()
})
export type TheMessageObject = z.infer<typeof TheMessageObjectSchema>

export const ListMessagesResponseClassSchema = z.object({
  data: z.array(TheMessageObjectSchema),
  first_id: z.string(),
  has_more: z.boolean(),
  last_id: z.string(),
  object: z.string()
})
export type ListMessagesResponseClass = z.infer<
  typeof ListMessagesResponseClassSchema
>

export const HilariousFunctionSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  name: z.string(),
  parameters: z.record(z.string(), z.any())
})
export type HilariousFunction = z.infer<typeof HilariousFunctionSchema>

export const ModifyAssistantRequestToolSchema = z.object({
  type: ToolTypeSchema,
  function: z.union([HilariousFunctionSchema, z.null()]).optional()
})
export type ModifyAssistantRequestTool = z.infer<
  typeof ModifyAssistantRequestToolSchema
>

export const ModifyAssistantRequestSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  file_ids: z.union([z.array(z.string()), z.null()]).optional(),
  instructions: z.union([z.null(), z.string()]).optional(),
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  model: z.union([z.null(), z.string()]).optional(),
  name: z.union([z.null(), z.string()]).optional(),
  tools: z
    .union([z.array(ModifyAssistantRequestToolSchema), z.null()])
    .optional()
})
export type ModifyAssistantRequest = z.infer<
  typeof ModifyAssistantRequestSchema
>

export const IndecentFunctionSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  name: z.string(),
  parameters: z.record(z.string(), z.any())
})
export type IndecentFunction = z.infer<typeof IndecentFunctionSchema>

export const CreateAssistantRequestToolSchema = z.object({
  type: ToolTypeSchema,
  function: z.union([IndecentFunctionSchema, z.null()]).optional()
})
export type CreateAssistantRequestTool = z.infer<
  typeof CreateAssistantRequestToolSchema
>

export const CreateAssistantRequestSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  file_ids: z.union([z.array(z.string()), z.null()]).optional(),
  instructions: z.union([z.null(), z.string()]).optional(),
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  model: z.string(),
  name: z.union([z.null(), z.string()]).optional(),
  tools: z
    .union([z.array(CreateAssistantRequestToolSchema), z.null()])
    .optional()
})
export type CreateAssistantRequest = z.infer<
  typeof CreateAssistantRequestSchema
>

export const IndigoFunctionSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  name: z.string(),
  parameters: z.record(z.string(), z.any())
})
export type IndigoFunction = z.infer<typeof IndigoFunctionSchema>

export const FluffyToolSchema = z.object({
  type: ToolTypeSchema,
  function: z.union([IndigoFunctionSchema, z.null()]).optional()
})
export type FluffyTool = z.infer<typeof FluffyToolSchema>

export const AssistantSchema = z.object({
  created_at: z.number(),
  description: z.string(),
  file_ids: z.array(z.string()),
  id: z.string(),
  instructions: z.string(),
  metadata: z.record(z.string(), z.any()),
  model: z.string(),
  name: z.string(),
  object: TentacledObjectSchema,
  tools: z.array(FluffyToolSchema)
})
export type Assistant = z.infer<typeof AssistantSchema>

export const ListAssistantsResponseSchema = z.object({
  data: z.array(AssistantSchema),
  first_id: z.string(),
  has_more: z.boolean(),
  last_id: z.string(),
  object: z.string()
})
export type ListAssistantsResponse = z.infer<
  typeof ListAssistantsResponseSchema
>

export const StickyFunctionSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  name: z.string(),
  parameters: z.record(z.string(), z.any())
})
export type StickyFunction = z.infer<typeof StickyFunctionSchema>

export const PurpleToolSchema = z.object({
  type: ToolTypeSchema,
  function: z.union([StickyFunctionSchema, z.null()]).optional()
})
export type PurpleTool = z.infer<typeof PurpleToolSchema>

export const TentacledFunctionSchema = z.object({
  arguments: z.string(),
  name: z.string()
})
export type TentacledFunction = z.infer<typeof TentacledFunctionSchema>

export const SubmitToolOutputsToolCallSchema = z.object({
  function: TentacledFunctionSchema,
  id: z.string(),
  type: PurpleTypeSchema
})
export type SubmitToolOutputsToolCall = z.infer<
  typeof SubmitToolOutputsToolCallSchema
>

export const SubmitToolOutputsSchema = z.object({
  tool_calls: z.array(SubmitToolOutputsToolCallSchema)
})
export type SubmitToolOutputs = z.infer<typeof SubmitToolOutputsSchema>

export const RequiredActionSchema = z.object({
  submit_tool_outputs: SubmitToolOutputsSchema,
  type: RequiredActionTypeSchema
})
export type RequiredAction = z.infer<typeof RequiredActionSchema>

export const FluffyLastErrorSchema = z.object({
  code: CodeSchema,
  message: z.string()
})
export type FluffyLastError = z.infer<typeof FluffyLastErrorSchema>

export const ARunOnAThreadSchema = z.object({
  assistant_id: z.string(),
  cancelled_at: z.number(),
  completed_at: z.number(),
  created_at: z.number(),
  expires_at: z.number(),
  failed_at: z.number(),
  file_ids: z.array(z.string()),
  id: z.string(),
  instructions: z.string(),
  last_error: FluffyLastErrorSchema,
  metadata: z.record(z.string(), z.any()),
  model: z.string(),
  object: FluffyObjectSchema,
  required_action: RequiredActionSchema,
  started_at: z.number(),
  status: FluffyStatusSchema,
  thread_id: z.string(),
  tools: z.array(PurpleToolSchema)
})
export type ARunOnAThread = z.infer<typeof ARunOnAThreadSchema>

export const ListRunsResponseSchema = z.object({
  data: z.array(ARunOnAThreadSchema),
  first_id: z.string(),
  has_more: z.boolean(),
  last_id: z.string(),
  object: z.string()
})
export type ListRunsResponse = z.infer<typeof ListRunsResponseSchema>

export const FluffyFunctionSchema = z.object({
  description: z.union([z.null(), z.string()]).optional(),
  name: z.string(),
  parameters: z.record(z.string(), z.any())
})
export type FluffyFunction = z.infer<typeof FluffyFunctionSchema>

export const CreateThreadAndRunRequestToolSchema = z.object({
  type: ToolTypeSchema,
  function: z.union([FluffyFunctionSchema, z.null()]).optional()
})
export type CreateThreadAndRunRequestTool = z.infer<
  typeof CreateThreadAndRunRequestToolSchema
>

export const MessageSchema = z.object({
  content: z.string(),
  file_ids: z.union([z.array(z.string()), z.null()]).optional(),
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  role: MessageRoleSchema
})
export type Message = z.infer<typeof MessageSchema>

export const ThreadClassSchema = z.object({
  messages: z.union([z.array(MessageSchema), z.null()]).optional(),
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional()
})
export type ThreadClass = z.infer<typeof ThreadClassSchema>

export const CreateThreadAndRunRequestSchema = z.object({
  assistant_id: z.string(),
  instructions: z.union([z.null(), z.string()]).optional(),
  metadata: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  model: z.union([z.null(), z.string()]).optional(),
  thread: z.union([ThreadClassSchema, z.null()]).optional(),
  tools: z
    .union([z.array(CreateThreadAndRunRequestToolSchema), z.null()])
    .optional()
})
export type CreateThreadAndRunRequest = z.infer<
  typeof CreateThreadAndRunRequestSchema
>

export const PurpleFunctionSchema = z.object({
  arguments: z.string(),
  name: z.string(),
  output: z.string()
})
export type PurpleFunction = z.infer<typeof PurpleFunctionSchema>

export const ImageSchema = z.object({
  file_id: z.string()
})
export type Image = z.infer<typeof ImageSchema>

export const CodeInterpreterOutputSchema = z.object({
  logs: z.union([z.null(), z.string()]).optional(),
  type: OutputTypeSchema,
  image: z.union([ImageSchema, z.null()]).optional()
})
export type CodeInterpreterOutput = z.infer<typeof CodeInterpreterOutputSchema>

export const CodeInterpreterSchema = z.object({
  input: z.string(),
  outputs: z.array(CodeInterpreterOutputSchema)
})
export type CodeInterpreter = z.infer<typeof CodeInterpreterSchema>

export const ToolCallSchema = z.object({
  code_interpreter: z.union([CodeInterpreterSchema, z.null()]).optional(),
  id: z.string(),
  type: ToolTypeSchema,
  retrieval: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  function: z.union([PurpleFunctionSchema, z.null()]).optional()
})
export type ToolCall = z.infer<typeof ToolCallSchema>

export const MessageCreationSchema = z.object({
  message_id: z.string()
})
export type MessageCreation = z.infer<typeof MessageCreationSchema>

export const StepDetailsSchema = z.object({
  message_creation: z.union([MessageCreationSchema, z.null()]).optional(),
  type: StepDetailsTypeSchema,
  tool_calls: z.union([z.array(ToolCallSchema), z.null()]).optional()
})
export type StepDetails = z.infer<typeof StepDetailsSchema>

export const PurpleLastErrorSchema = z.object({
  code: CodeSchema,
  message: z.string()
})
export type PurpleLastError = z.infer<typeof PurpleLastErrorSchema>

export const RunStepsSchema = z.object({
  assistant_id: z.string(),
  cancelled_at: z.number(),
  completed_at: z.number(),
  created_at: z.number(),
  expired_at: z.number(),
  failed_at: z.number(),
  id: z.string(),
  last_error: PurpleLastErrorSchema,
  metadata: z.record(z.string(), z.any()),
  object: PurpleObjectSchema,
  run_id: z.string(),
  status: PurpleStatusSchema,
  step_details: StepDetailsSchema,
  thread_id: z.string(),
  type: StepDetailsTypeSchema
})
export type RunSteps = z.infer<typeof RunStepsSchema>

export const ListRunStepsResponseClassSchema = z.object({
  data: z.array(RunStepsSchema),
  first_id: z.string(),
  has_more: z.boolean(),
  last_id: z.string(),
  object: z.string()
})
export type ListRunStepsResponseClass = z.infer<
  typeof ListRunStepsResponseClassSchema
>
