import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'

import assistantFiles from './assistant-files'
import assistants from './assistants'
import files from './files'
import messageFiles from './message-files'
import messages from './messages'
import runs from './runs'
import threads from './threads'

const app = new OpenAPIHono()

app.route('', files)
app.route('', assistants)
app.route('', assistantFiles)
app.route('', threads)
app.route('', messages)
app.route('', messageFiles)
app.route('', runs)

app.doc('/openapi', {
  openapi: '3.0.0',
  info: {
    version: '2.0.0',
    title: 'OpenAPI'
  }
})

serve(app)
