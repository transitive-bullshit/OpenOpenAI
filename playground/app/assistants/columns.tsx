'use client'

import {
  CopyIcon,
  Pencil2Icon,
  PlayIcon,
  TrashIcon
} from '@radix-ui/react-icons'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { deleteAssistant } from '@/lib/openai'
import type { Assistant } from '@/lib/types'

export const columns: ColumnDef<Assistant>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return <b>{row.getValue('name')}</b>
    }
  },
  {
    accessorKey: 'instructions',
    header: 'Instructions',
    cell: ({ row }) => {
      return <p className='line-clamp-3'>{row.getValue('instructions')}</p>
    }
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'created_at',
    header: 'Date Created'
  },
  {
    id: 'actions',
    cell: Cell
  }
]

function Cell({ row }: { row: Row<Assistant> }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>

          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => router.push(`/assistants/${row.original.id}`)}
        >
          <Pencil2Icon className='mr-2 h-4 w-4' /> Edit
        </DropdownMenuItem>

        <DropdownMenuItem disabled>
          <CopyIcon className='mr-2 h-4 w-4' /> Clone
        </DropdownMenuItem>

        <DropdownMenuItem
          className='text-green-600'
          onClick={() => router.push(`/assistants/${row.original.id}`)}
        >
          <PlayIcon className='mr-2 h-4 w-4' />
          Test in Playground
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className='text-red-600'
          onClick={() =>
            deleteAssistant(row.original.id).then(() =>
              toast.success(`Assistant ${row.original.id} deleted`)
            )
          }
        >
          <TrashIcon className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
