export const env = process.env.NODE_ENV || 'development'
export const isDev = env === 'development'

export namespace queue {
  export const name = 'openopenai'

  export const RedisConfig = {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
  }

  export const concurrency = isDev ? 1 : 16
  // 10 minute timeout, including waiting for tool outputs
  export const stalledInterval = 10 * 60 * 1000
  export const threadRunJobName = 'thread-run'
}

export namespace storage {
  export const bucket = process.env.S3_BUCKET!
}
