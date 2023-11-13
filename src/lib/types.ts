import type { Run } from './db'

export type JobData = {
  runId: string
}

export type JobResult = {
  runId: string
  status: Run['status']
  error?: string
}
