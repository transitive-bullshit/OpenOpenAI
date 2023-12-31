# OpenOpenAI <!-- omit in toc -->

<p align="center">
  <img alt="Example usage" src="/media/screenshot.jpg">
</p>

<p>
  <a href="https://github.com/transitive-bullshit/OpenOpenAI/actions/workflows/test.yml"><img alt="Build Status" src="https://github.com/transitive-bullshit/OpenOpenAI/actions/workflows/test.yml/badge.svg" /></a>
  <a href="https://github.com/transitive-bullshit/OpenOpenAI/blob/main/license"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
  <a href="https://prettier.io"><img alt="Prettier Code Formatting" src="https://img.shields.io/badge/code_style-prettier-brightgreen.svg" /></a>
</p>

- [Intro](#intro)
- [Why?](#why)
- [Stack](#stack)
- [Development](#development)
  - [Environment Variables](#environment-variables)
  - [Services](#services)
  - [E2E Examples](#e2e-examples)
    - [Custom Function Example](#custom-function-example)
    - [Retrieval Tool Example](#retrieval-tool-example)
  - [Server routes](#server-routes)
- [TODO](#todo)
- [License](#license)

## Intro

**This project is a self-hosted version of OpenAI's new stateful Assistants API.** 💪

All [API route definitions](./src/generated/oai-routes.ts) and [types](./src/generated/oai.ts) are **100% auto-generated** from OpenAI's official OpenAPI spec, so all it takes to switch between the official API and your custom API is changing the `baseURL`. 🤯

This means that all API parameters, responses, and types are wire-compatible with the official OpenAI API, and the fact that they're auto-generated means that it will be relatively easy to keep them in sync over time.

Here's an example using the official Node.js `openai` package:

```ts
import OpenAI from 'openai'

// The only difference is the `baseURL` pointing to your custom API server 🔥
const openai = new OpenAI({
  baseURL: 'http://localhost:3000'
})

// Since the custom API is spec-compliant with OpenAI, you can use the sdk normally 💯
const assistant = await openai.beta.assistants.create({
  model: 'gpt-4-1106-preview',
  instructions: 'You are a helpful assistant.'
})
```

<details>
<summary>Python example</summary>

Here's the same example using the official Python `openai` package:

```py
from openai import OpenAI

client = OpenAI(
    base_url: "http://localhost:3000"
)

# Now you can use the sdk normally!
# (only file and beta assistant resources are currently supported)
# You can even switch back and forth between the official and custom APIs!
assistant = client.beta.assistants.create(
    model="gpt-4-1106-preview",
    description="You are a helpful assistant."
)
```

</details>

Note that this project is not meant to be a full recreation of the entire OpenAI API. Rather, **it is focused only on the stateful portions of the new Assistants API**. The following resource types are supported:

- Assistants
- AssistantFiles
- Files
- Messages
- MessageFiles
- Threads
- Runs
- RunSteps

See the official [OpenAI Assistants Guide](https://platform.openai.com/docs/assistants/how-it-works) for more info on how Assistants work.

## Why?

Being able to run your own, custom OpenAI Assistants that are **100% compatible with the official OpenAI Assistants** unlocks all sorts of useful possibilities:

- Using OpenAI Assistants with **custom models** (OSS ftw!) 💪
- **Fully customizable RAG** via the built-in retrieval tool (LangChain and LlamaIndex integrations [coming soon](https://github.com/transitive-bullshit/OpenOpenAI/issues/2))
- Using a **custom code interpreter** like [open-interpreter](https://github.com/KillianLucas/open-interpreter) 🔥
- **Self-hosting / on-premise** deployments of Assistants
- Full control over **assistant evals**
- Developing & testing GPTs in fully **sandboxed environments**
- Sandboxed testing of **custom Actions** before deploying to the OpenAI "GPT Store"

Most importantly, if the OpenAI "GPT Store" ends up gaining traction with ChatGPT's 100M weekly active users, then **the ability to reliably run, debug, and customize OpenAI-compatible Assistants** will end up being incredibly important in the future.

I could even imagine a future Assistant store which is fully compatible with OpenAI's GPTs, but instead of relying on OpenAI as the gatekeeper, it could be **fully or partially decentralized**. 💯

## Stack

- [Postgres](https://www.postgresql.org) - Primary datastore via [Prisma](https://www.prisma.io) ([schema file](./prisma/schema.prisma))
- [Redis](https://redis.io) - Backing store for the async task queue used to process thread runs via [BullMQ](https://bullmq.io)
- [S3](https://aws.amazon.com/s3) - Stores uploaded files
  - Any S3-compatible storage provider is supported, such as [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Hono](https://hono.dev) - Serves the REST API via [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
  - We're using the [Node.js](https://hono.dev/getting-started/nodejs) adaptor by default, but Hono supports many environments including CF workers, Vercel, Netlify, Deno, Bun, Lambda, etc.
- [Dexter](https://github.com/dexaai/dexter) - Production RAG by [Dexa](https://dexa.ai)
- [TypeScript](https://www.typescriptlang.org) 💕

## Development

Prerequisites:

- [node](https://nodejs.org/en) >= 18
- [pnpm](https://pnpm.io) >= 8

Install deps:

```bash
pnpm install
```

Generate the prisma types locally:

```bash
pnpm generate
```

### Environment Variables

```bash
cp .env.example .env
```

- **Postgres**
  - `DATABASE_URL` - Postgres connection string
  - [On macOS](https://wiki.postgresql.org/wiki/Homebrew): `brew install postgresql && brew services start postgresql`
  - You'll need to run `npx prisma db push` to set up your database according to our [prisma schema](./prisma/schema.prisma)
- **OpenAI**
  - `OPENAI_API_KEY` - OpenAI API key for running the underlying chat completion calls
  - This is required for now, but depending on [how interested people are](https://github.com/transitive-bullshit/OpenOpenAI/issues/1), it won't be hard to add support for local models and other providers
- **Redis**
  - [On macOS](https://redis.io/docs/install/install-redis/install-redis-on-mac-os/): `brew install redis && brew services start redis`
  - If you have a local redis instance running, the default redis env vars should work without touching them
  - `REDIS_HOST` - Optional; defaults to `localhost`
  - `REDIS_PORT` - Optional; defaults to `6379`
  - `REDIS_USERNAME` - Optional; defaults to `default`
  - `REDIS_PASSWORD` - Optional
- **S3** - Required to use file attachments
  - Any S3-compatible provider is supported, such as [Cloudflare R2](https://developers.cloudflare.com/r2/)
  - Alterantively, you can use a local S3 server like [MinIO](https://github.com/minio/minio#homebrew-recommended) or [LocalStack](https://github.com/localstack/localstack)
    - To run LocalStack on macOS: `brew install localstack/tap/localstack-cli && localstack start -d`
    - To run MinIO macOS: `brew install minio/stable/minio && minio server /data`
  - I recommend using Cloudflare R2, though – it's amazing and should be free for most use cases!
  - `S3_BUCKET` - Required
  - `S3_REGION` - Optional; defaults to `auto`
  - `S3_ENDPOINT` - Required; example: `https://<id>.r2.cloudflarestorage.com`
  - `ACCESS_KEY_ID` - Required ([cloudflare R2 docs](https://developers.cloudflare.com/r2/api/s3/tokens/))
  - `SECRET_ACCESS_KEY` - Required ([cloudflare R2 docs](https://developers.cloudflare.com/r2/api/s3/tokens/))

### Services

The app is composed of two services: a RESTful API **server** and an async task **runner**. Both services are stateless and can be scaled horizontally.

There are two ways to run these services locally. The quickest way is via `tsx`:

```bash
# Start the REST API server in one shell
npx tsx src/server

# Start an async task queue runner in another shell
npx tsx src/runner
```

Alternatively, you can transpile the source TS to JS first, which is preferred for running in production:

```bash
pnpm build

# Start the REST API server in one shell
npx tsx dist/server

# Start an async task queue runner in another shell
npx tsx dist/runner
```

### E2E Examples

#### Custom Function Example

[This example](./e2e/index.ts) contains an end-to-end assistant script which uses a custom `get_weather` function.

You can run it using the official [openai](https://github.com/openai/openai-node) client for Node.js against the default OpenAI API hosted at `https://api.openai.com/v1`.

```bash
npx tsx e2e
```

To run the same test suite against your local API, you can run:

```bash
OPENAI_API_BASE_URL='http://127.0.0.1:3000' npx tsx e2e
```

It's pretty cool to see both test suites running the exact same Assistants code using the official OpenAI Node.js client – without any noticeable differences between the two versions. Huzzah! 🥳

#### Retrieval Tool Example

[This example](./e2e/retrieval.ts) contains an end-to-end assistant script which uses the built-in `retrieval` tool with this `readme.md` file as an attachment.

You can run it using the official [openai](https://github.com/openai/openai-node) client for Node.js against the default OpenAI API hosted at `https://api.openai.com/v1`.

```bash
npx tsx e2e/retrieval.ts
```

To run the same test suite against your local API, you can run:

```bash
OPENAI_API_BASE_URL='http://127.0.0.1:3000' npx tsx e2e/retrieval.ts
```

The output will likely differ slightly due to differences in OpenAI's built-in retrieval implementation and [our default, naive retrieval implementation](./src/lib/retrieval.ts).

Note that the [current `retrieval` implementation](https://github.com/transitive-bullshit/OpenOpenAI/blob/main/src/lib/retrieval.ts) only support text files like `text/plain` and markdown, as no preprocessing or conversions are done at the moment. We also use a very naive retrieval method at the moment which always returns the full file contents as opposed to pre-processing them and only returning the most semantically relevant chunks. See [this issue](https://github.com/transitive-bullshit/OpenOpenAI/issues/2) for more info.

### Server routes

```
GET       /files
POST      /files
DELETE    /files/:file_id
GET       /files/:file_id
GET       /files/:file_id/content
GET       /assistants
POST      /assistants
GET       /assistants/:assistant_id
POST      /assistants/:assistant_id
DELETE    /assistants/:assistant_id
GET       /assistants/:assistant_id/files
GET       /assistants/:assistant_id/files
POST      /assistants/:assistant_id/files
DELETE    /assistants/:assistant_id/files/:file_id
GET       /assistants/:assistant_id/files/:file_id
POST      /threads
GET       /threads/:thread_id
POST      /threads/:thread_id
DELETE    /threads/:thread_id
GET       /threads/:thread_id/messages
POST      /threads/:thread_id/messages
GET       /threads/:thread_id/messages/:message_id
POST      /threads/:thread_id/messages/:message_id
GET       /threads/:thread_id/messages/:message_id/files
GET       /threads/:thread_id/messages/:message_id/files/:file_id
GET       /threads/:thread_id/runs
POST      /threads/runs
POST      /threads/:thread_id/runs
GET       /threads/:thread_id/runs/:run_id
POST      /threads/:thread_id/runs/:run_id
POST      /threads/:thread_id/runs/:run_id/submit_tool_outputs
POST      /threads/:thread_id/runs/:run_id/cancel
GET       /threads/:thread_id/runs/:run_id/steps
GET       /threads/:thread_id/runs/:run_id/steps/:step_id
GET       /openapi
```

You can view the server's auto-generated openapi spec by running the server and then visiting `http://127.0.0.1:3000/openapi`

## TODO

**Status**: All API routes have been tested side-by-side with the official OpenAI API and are working as expected. The only missing features at the moment are support for the built-in `code_interpreter` tool ([issue](https://github.com/transitive-bullshit/OpenOpenAI/issues/3)) and support for non-text files with the built-in `retrieval` tool ([issue](https://github.com/transitive-bullshit/OpenOpenAI/issues/2)). All other functionality should be fully supported and wire-compatible with the official API.

**TODO**:

- hosted demo (bring your own OpenAI API key?)
- get hosted redis working
- handle locking thread and messages
  - not sure how this works exactly, but according to the [OpenAI Assistants Guide](https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps), threads are locked while runs are being processed
- built-in `code_interpreter` tool ([issue](https://github.com/transitive-bullshit/OpenOpenAI/issues/3))
- support non-text files w/ built-in `retrieval` tool ([issue](https://github.com/transitive-bullshit/OpenOpenAI/issues/2))
- openai uses prefix IDs for its resources, which would be great, except it's a pain to get working with Prisma ([issue](https://github.com/transitive-bullshit/OpenOpenAI/issues/7))
- figure out why localhost resolution wasn't working for [#6](https://github.com/transitive-bullshit/OpenOpenAI/pull/6)
- handle context overflows (truncation for now)

## License

MIT © [Travis Fischer](https://transitivebullsh.it)

If you found this project useful, please consider [sponsoring me](https://github.com/sponsors/transitive-bullshit) or <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
