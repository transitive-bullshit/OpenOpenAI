import { type ConnectionOptions } from 'bullmq'

export const env = process.env.NODE_ENV || 'development'
export const isDev = env === 'development'

export const port = parseInt(process.env.PORT || '3000')
export const processGracefulExitWaitTimeMs = 5000

export namespace runs {
  // 10 minute timeout, including waiting for tool outputs
  export const maxRunTime = 10 * 60 * 1000
}

export namespace queue {
  export const name = 'openopenai'

  export const redisConfig: ConnectionOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME ?? 'default'
  }

  export const concurrency = isDev ? 1 : 16
  export const stalledInterval = runs.maxRunTime
  export const threadRunJobName = 'thread-run'

  export const startRunner = !!process.env.START_RUNNER
}

export namespace storage {
  export const bucket = process.env.S3_BUCKET!
}
