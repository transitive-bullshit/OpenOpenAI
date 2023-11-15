import { Queue } from 'bullmq'

import * as config from './config'
import type { Run, RunStep } from './db'
import type { JobData, JobResult } from './types'

export const queue = new Queue<JobData, JobResult>(config.queue.name, {
  connection: config.queue.redisConfig,
  defaultJobOptions: config.queue.defaultJobOptions
})

export function getJobId(run: Run, runStep?: RunStep) {
  return `${run.id}${runStep?.id ? '-' + runStep.id : ''}`
}

// Useful for debugging queue issues
// const active = (await queue.getActive()).map((job) => job.asJSON())
// const completed = (await queue.getCompleted()).map((job) => job.asJSON())
// const failed = (await queue.getFailed()).map((job) => job.asJSON())
// const delayed = (await queue.getDelayed()).map((job) => job.asJSON())
// const jobs = (await queue.getJobs()).map((job) => job.asJSON())
// console.log('active', active)
// console.log('completed', completed)
// console.log('failed', failed)
// console.log('delayed', delayed)
// console.log('jobs', jobs)
