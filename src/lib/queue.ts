import { Queue } from 'bullmq'

import * as config from './config'
import type { JobData, JobResult } from './types'

export const queue = new Queue<JobData, JobResult>(config.queue.name, {
  connection: config.queue.RedisConfig
})
