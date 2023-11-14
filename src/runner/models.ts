import { ChatModel, createOpenAIClient } from '@dexaai/dexter/model'

import * as config from '../lib/config'

export const chatModel = new ChatModel({
  client: createOpenAIClient(),
  debug: config.isDev
})
