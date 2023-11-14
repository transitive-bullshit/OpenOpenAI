# OpenOpenAI <!-- omit in toc -->

<p>
  <a href="https://github.com/transitive-bullshit/OpenOpenAI/actions/workflows/test.yml"><img alt="Build Status" src="https://github.com/transitive-bullshit/OpenOpenAI/actions/workflows/test.yml/badge.svg" /></a>
  <a href="https://github.com/transitive-bullshit/OpenOpenAI/blob/main/license"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
  <a href="https://prettier.io"><img alt="Prettier Code Formatting" src="https://img.shields.io/badge/code_style-prettier-brightgreen.svg" /></a>
</p>

- [Intro](#intro)
- [Tech Stack](#tech-stack)
- [Development](#development)
  - [Environment Variables](#environment-variables)
  - [Services](#services)
  - [E2E Example](#e2e-example)
  - [Server routes](#server-routes)
- [TODO](#todo)
- [License](#license)

## Intro

**This project is a self-hosted version of OpenAI's new stateful Assistants API.** 💪

All [API route definitions](./src/generated/oai-routes.ts) and [types](./src/generated/oai.ts) are **100% auto-generated** from OpenAI's official OpenAPI spec, so you can switch between the official OpenAI API and your custom API simply by changing the `baseUrl`. 🤯

This means that all API parameters, responses, and types are wire-compatible with the official OpenAI API, and the fact that they're auto-generated means that it will be relatively easy to keep them in sync over time.

This unlocks all sorts of useful applications... including:

- Using the OpenAI Assistants API with **custom models**
- Full customization over the built-in retrieval tool
- Using a **custom code interpreter** like [open-interpreter](https://github.com/KillianLucas/open-interpreter)
- **Self-hosting / on-premise** deployments of OpenAI-compatible Assistants
- Full control over assistant **evals**
- Developing & testing GPTs in a fully **sandboxed environment**
- Sandboxed testing of **custom Actions** before deploying to the OpenAI "GPT Store"

This project is not meant to be a full recreation of the entire OpenAI API. Rather, it is focused on the stateful portions of the new Assistants API. It supports the following resources:

- Assistants
- AssistantFiles
- Files
- Messages
- MessageFiles
- Threads
- Runs
- RunSteps

## Tech Stack

- [Postgres](https://www.postgresql.org) - Primary datastore via [Prisma](https://www.prisma.io) ([schema file](./prisma/schema.prisma))
- [Redis](https://redis.io) - Backing store for the async task queue used to process thread runs via [BullMQ](https://bullmq.io)
- [S3](https://aws.amazon.com/s3) - Stores uploaded files
  - Any S3-compatible storage provider is supported, such as [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Hono](https://hono.dev) - Serves the REST API via [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
  - We're using the [Node.js](https://hono.dev/getting-started/nodejs) adaptor by default, but Hono supports many environments including CF workers, Vercel, Netlify, Deno, Bun, Lambda, etc.
- [TypeScript](https://www.typescriptlang.org) 💕

## Development

Prerequisites:

- [node](https://nodejs.org/en) >= 18
- [pnpm](https://pnpm.io) >= 8

Install deps:

```bash
pnpm install
```

### Environment Variables

```bash
cp .env.example .env
```

- Postgres
  - `DATABASE_URL` - Postgres connection string
- OpenAI
  - `OPENAI_API_KEY` - OpenAI API key for running the underlying chat completion calls
  - This is required for now, but depending on how interested people are, it won't be hard to add support for local models and other providers
- Redis
  - If you have a local redis instance running, you shouldn't need to set any env vars for redis
  - `REDIS_HOST` - Optional; defaults to `localhost`
  - `REDIS_PORT` - Optional; defaults to `6379`
  - `REDIS_USERNAME` - Optional; defaults to `default`
  - `REDIS_PASSWORD` - Optional
- S3 - Required to use file attachments
  - Any S3-compatible provider is supported, such as [Cloudflare R2](https://developers.cloudflare.com/r2/)
  - Seriously, just use R2 – it's amazing!
  - `S3_BUCKET` - Required
  - `S3_REGION` - Optional; defaults to `auto`
  - `S3_ENDPOINT` - Required; example: `https://<id>.r2.cloudflarestorage.com`
  - `ACCESS_KEY_ID` - Required ([cloudflare R2 docs](https://developers.cloudflare.com/r2/api/s3/tokens/))
  - `SECRET_ACCESS_KEY` - Required ([cloudflare R2 docs](https://developers.cloudflare.com/r2/api/s3/tokens/))

### Services

The app is comprised of two services: a RESTful API **server** and an async task **runner**. Both services are stateless and can be scaled horizontally.

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

### E2E Example

This will run an [end-to-end assistant example](./e2e/index.ts), complete with custom tool invocation, using the official [openai](https://github.com/openai/openai-node) client for Node.js against the default OpenAI API hosted at `https://api.openai.com/v1`.

```bash
npx tsx e2e
```

To run the same test suite against your local API, you can run:

```bash
OPENAI_API_BASE_URL='http://localhost:3000' npx tsx e2e
```

It's pretty cool to see both test suites running the exact same Assistants code using the official OpenAI Node.js client – without any noticeable differences between the two versions. Huzzah! 🥳

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

## TODO

- prefix ids (see [prisma 3391](https://github.com/prisma/prisma/issues/3391) and [prisma 6719](https://github.com/prisma/prisma/issues/6719))
- get hosted redis working
- hosted demo
- handle locking thread and messages
- built-in retrieval tool
- built-in interpreter tool
- handle context overflows

## License

MIT © [Travis Fischer](https://transitivebullsh.it)
