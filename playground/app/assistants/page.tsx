'use server'

import { listAssistants } from '@/lib/openai'
import type { Assistant } from '@/lib/types'

import { columns } from './columns'
import { DataTable } from './data-table'

async function getAssistants(): Promise<Assistant[]> {
  const res = await listAssistants({ limit: 100 })
  return res.data
}

export default async function AssistantsPage() {
  const data = await getAssistants()

  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div className='container mx-auto py-10'>
        <DataTable columns={columns} data={data} />
      </div>
    </main>
  )
}
