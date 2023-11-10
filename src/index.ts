import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'

import files from './files'

const app = new OpenAPIHono()
app.route('/files', files)

app.doc('/openapi', {
  openapi: '3.0.0',
  info: {
    version: '2.0.0',
    title: 'OpenAPI'
  }
})

serve(app)
