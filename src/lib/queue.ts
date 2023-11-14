import { Queue } from 'bullmq'

import * as config from './config'
import type { Run, RunStep } from './db'
import type { JobData, JobResult } from './types'

export const queue = new Queue<JobData, JobResult>(config.queue.name, {
  connection: config.queue.RedisConfig
})

export function getJobId(run: Run, runStep?: RunStep) {
  return `${run.id}${runStep?.id ? '-' + runStep.id : ''}`
}
