/**
 * This file is auto-generated by OpenOpenAI using OpenAI's OpenAPI spec as a
 * source of truth.
 *
 * DO NOT EDIT THIS FILE MANUALLY if you want your changes to persist.
 */

import { createRoute } from '@hono/zod-openapi'

import * as oai from './oai'

export const listFiles = createRoute({
  method: 'get',
  path: '/files',
  summary: "Returns a list of files that belong to the user's organization.",
  request: {
    query: oai.ListFilesParamsQueryClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ListFilesResponseSchema.openapi('ListFilesResponse')
        }
      }
    }
  }
})

export const createFile = createRoute({
  method: 'post',
  path: '/files',
  summary:
    'Upload a file that can be used across various endpoints/features. The size of all the files uploaded by one organization can be up to 100 GB.\n\nThe size of individual files for can be a maximum of 512MB. See the [Assistants Tools guide](/docs/assistants/tools) to learn more about the types of files supported. The Fine-tuning API only supports `.jsonl` files.\n\nPlease [contact us](https://help.openai.com/) if you need to increase these storage limits.\n',
  request: {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: oai.CreateFileRequestSchema.openapi('CreateFileRequest')
        }
      }
    }
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.OpenAIFileClassSchema.openapi('OpenAIFile')
        }
      }
    }
  }
})

export const deleteFile = createRoute({
  method: 'delete',
  path: '/files/{file_id}',
  summary: 'Delete a file.',
  request: {
    params: oai.DeleteFileParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.DeleteFileResponseSchema.openapi('DeleteFileResponse')
        }
      }
    }
  }
})

export const retrieveFile = createRoute({
  method: 'get',
  path: '/files/{file_id}',
  summary: 'Returns information about a specific file.',
  request: {
    params: oai.RetrieveFileParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.OpenAIFileClassSchema.openapi('OpenAIFile')
        }
      }
    }
  }
})

export const downloadFile = createRoute({
  method: 'get',
  path: '/files/{file_id}/content',
  summary: 'Returns the contents of the specified file.',
  request: {
    params: oai.DownloadFileParamsPathClassSchema
  },
  responses: {}
})

export const listAssistants = createRoute({
  method: 'get',
  path: '/assistants',
  summary: 'Returns a list of assistants.',
  request: {
    query: oai.ListAssistantsParamsQueryClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ListAssistantsResponseSchema.openapi(
            'ListAssistantsResponse'
          )
        }
      }
    }
  }
})

export const createAssistant = createRoute({
  method: 'post',
  path: '/assistants',
  summary: 'Create an assistant with a model and instructions.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.CreateAssistantRequestSchema.openapi(
            'CreateAssistantRequest'
          )
        }
      }
    }
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.AssistantObjectSchema.openapi('AssistantObject')
        }
      }
    }
  }
})

export const getAssistant = createRoute({
  method: 'get',
  path: '/assistants/{assistant_id}',
  summary: 'Retrieves an assistant.',
  request: {
    params: oai.GetAssistantParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.AssistantObjectSchema.openapi('AssistantObject')
        }
      }
    }
  }
})

export const modifyAssistant = createRoute({
  method: 'post',
  path: '/assistants/{assistant_id}',
  summary: 'Modifies an assistant.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.ModifyAssistantRequestSchema.openapi(
            'ModifyAssistantRequest'
          )
        }
      }
    },
    params: oai.ModifyAssistantParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.AssistantObjectSchema.openapi('AssistantObject')
        }
      }
    }
  }
})

export const deleteAssistant = createRoute({
  method: 'delete',
  path: '/assistants/{assistant_id}',
  summary: 'Delete an assistant.',
  request: {
    params: oai.DeleteAssistantParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.DeleteAssistantResponseSchema.openapi(
            'DeleteAssistantResponse'
          )
        }
      }
    }
  }
})

export const createThread = createRoute({
  method: 'post',
  path: '/threads',
  summary: 'Create a thread.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: oai.CreateThreadRequestSchema.openapi('CreateThreadRequest')
        }
      }
    }
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ThreadObjectSchema.openapi('ThreadObject')
        }
      }
    }
  }
})

export const getThread = createRoute({
  method: 'get',
  path: '/threads/{thread_id}',
  summary: 'Retrieves a thread.',
  request: {
    params: oai.GetThreadParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ThreadObjectSchema.openapi('ThreadObject')
        }
      }
    }
  }
})

export const modifyThread = createRoute({
  method: 'post',
  path: '/threads/{thread_id}',
  summary: 'Modifies a thread.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.ModifyThreadRequestSchema.openapi('ModifyThreadRequest')
        }
      }
    },
    params: oai.ModifyThreadParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ThreadObjectSchema.openapi('ThreadObject')
        }
      }
    }
  }
})

export const deleteThread = createRoute({
  method: 'delete',
  path: '/threads/{thread_id}',
  summary: 'Delete a thread.',
  request: {
    params: oai.DeleteThreadParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.DeleteThreadResponseSchema.openapi('DeleteThreadResponse')
        }
      }
    }
  }
})

export const listMessages = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/messages',
  summary: 'Returns a list of messages for a given thread.',
  request: {
    params: oai.ListMessagesParamsPathClassSchema,
    query: oai.ListMessagesParamsQueryClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ListMessagesResponseClassSchema.openapi(
            'ListMessagesResponse'
          )
        }
      }
    }
  }
})

export const createMessage = createRoute({
  method: 'post',
  path: '/threads/{thread_id}/messages',
  summary: 'Create a message.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.CreateMessageRequestSchema.openapi('CreateMessageRequest')
        }
      }
    },
    params: oai.CreateMessageParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.MessageObjectSchema.openapi('MessageObject')
        }
      }
    }
  }
})

export const getMessage = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/messages/{message_id}',
  summary: 'Retrieve a message.',
  request: {
    params: oai.GetMessageParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.MessageObjectSchema.openapi('MessageObject')
        }
      }
    }
  }
})

export const modifyMessage = createRoute({
  method: 'post',
  path: '/threads/{thread_id}/messages/{message_id}',
  summary: 'Modifies a message.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.ModifyMessageRequestSchema.openapi('ModifyMessageRequest')
        }
      }
    },
    params: oai.ModifyMessageParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.MessageObjectSchema.openapi('MessageObject')
        }
      }
    }
  }
})

export const createThreadAndRun = createRoute({
  method: 'post',
  path: '/threads/runs',
  summary: 'Create a thread and run it in one request.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.CreateThreadAndRunRequestSchema.openapi(
            'CreateThreadAndRunRequest'
          )
        }
      }
    }
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.RunObjectSchema.openapi('RunObject')
        }
      }
    }
  }
})

export const listRuns = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/runs',
  summary: 'Returns a list of runs belonging to a thread.',
  request: {
    params: oai.ListRunsParamsPathClassSchema,
    query: oai.ListRunsParamsQueryClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ListRunsResponseSchema.openapi('ListRunsResponse')
        }
      }
    }
  }
})

export const createRun = createRoute({
  method: 'post',
  path: '/threads/{thread_id}/runs',
  summary: 'Create a run.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.CreateRunRequestSchema.openapi('CreateRunRequest')
        }
      }
    },
    params: oai.CreateRunParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.RunObjectSchema.openapi('RunObject')
        }
      }
    }
  }
})

export const getRun = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/runs/{run_id}',
  summary: 'Retrieves a run.',
  request: {
    params: oai.GetRunParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.RunObjectSchema.openapi('RunObject')
        }
      }
    }
  }
})

export const modifyRun = createRoute({
  method: 'post',
  path: '/threads/{thread_id}/runs/{run_id}',
  summary: 'Modifies a run.',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.ModifyRunRequestSchema.openapi('ModifyRunRequest')
        }
      }
    },
    params: oai.ModifyRunParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.RunObjectSchema.openapi('RunObject')
        }
      }
    }
  }
})

export const submitToolOuputsToRun = createRoute({
  method: 'post',
  path: '/threads/{thread_id}/runs/{run_id}/submit_tool_outputs',
  summary:
    'When a run has the `status: "requires_action"` and `required_action.type` is `submit_tool_outputs`, this endpoint can be used to submit the outputs from the tool calls once they\'re all completed. All outputs must be submitted in a single request.\n',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.SubmitToolOutputsRunRequestSchema.openapi(
            'SubmitToolOutputsRunRequest'
          )
        }
      }
    },
    params: oai.SubmitToolOuputsToRunParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.RunObjectSchema.openapi('RunObject')
        }
      }
    }
  }
})

export const cancelRun = createRoute({
  method: 'post',
  path: '/threads/{thread_id}/runs/{run_id}/cancel',
  summary: 'Cancels a run that is `in_progress`.',
  request: {
    params: oai.CancelRunParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.RunObjectSchema.openapi('RunObject')
        }
      }
    }
  }
})

export const listRunSteps = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/runs/{run_id}/steps',
  summary: 'Returns a list of run steps belonging to a run.',
  request: {
    params: oai.ListRunStepsParamsPathClassSchema,
    query: oai.ListRunStepsParamsQueryClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ListRunStepsResponseClassSchema.openapi(
            'ListRunStepsResponse'
          )
        }
      }
    }
  }
})

export const getRunStep = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/runs/{run_id}/steps/{step_id}',
  summary: 'Retrieves a run step.',
  request: {
    params: oai.GetRunStepParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.RunStepObjectSchema.openapi('RunStepObject')
        }
      }
    }
  }
})

export const listAssistantFiles = createRoute({
  method: 'get',
  path: '/assistants/{assistant_id}/files',
  summary: 'Returns a list of assistant files.',
  request: {
    params: oai.ListAssistantFilesParamsPathClassSchema,
    query: oai.ListAssistantFilesParamsQueryClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ListAssistantFilesResponseClassSchema.openapi(
            'ListAssistantFilesResponse'
          )
        }
      }
    }
  }
})

export const createAssistantFile = createRoute({
  method: 'post',
  path: '/assistants/{assistant_id}/files',
  summary:
    'Create an assistant file by attaching a [File](/docs/api-reference/files) to an [assistant](/docs/api-reference/assistants).',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: oai.CreateAssistantFileRequestSchema.openapi(
            'CreateAssistantFileRequest'
          )
        }
      }
    },
    params: oai.CreateAssistantFileParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.AssistantFileObjectSchema.openapi('AssistantFileObject')
        }
      }
    }
  }
})

export const getAssistantFile = createRoute({
  method: 'get',
  path: '/assistants/{assistant_id}/files/{file_id}',
  summary: 'Retrieves an AssistantFile.',
  request: {
    params: oai.GetAssistantFileParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.AssistantFileObjectSchema.openapi('AssistantFileObject')
        }
      }
    }
  }
})

export const deleteAssistantFile = createRoute({
  method: 'delete',
  path: '/assistants/{assistant_id}/files/{file_id}',
  summary: 'Delete an assistant file.',
  request: {
    params: oai.DeleteAssistantFileParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.DeleteAssistantFileResponseSchema.openapi(
            'DeleteAssistantFileResponse'
          )
        }
      }
    }
  }
})

export const listMessageFiles = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/messages/{message_id}/files',
  summary: 'Returns a list of message files.',
  request: {
    params: oai.ListMessageFilesParamsPathClassSchema,
    query: oai.ListMessageFilesParamsQueryClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.ListMessageFilesResponseClassSchema.openapi(
            'ListMessageFilesResponse'
          )
        }
      }
    }
  }
})

export const getMessageFile = createRoute({
  method: 'get',
  path: '/threads/{thread_id}/messages/{message_id}/files/{file_id}',
  summary: 'Retrieves a message file.',
  request: {
    params: oai.GetMessageFileParamsPathClassSchema
  },
  responses: {
    '200': {
      description: 'OK',
      content: {
        'application/json': {
          schema: oai.MessageFileObjectSchema.openapi('MessageFileObject')
        }
      }
    }
  }
})
