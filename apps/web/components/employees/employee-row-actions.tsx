'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Archive, RotateCcw, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from '@hrms/ui'
import {
  archiveEmployeeAction,
  restoreEmployeeAction,
  deleteEmployeeAction,
} from '@/app/dashboard/employees/actions'

export function EmployeeRowActions({
  employeeId,
  status,
  onEdit,
}: {
  employeeId: string
  status: 'active' | 'passive'
  onEdit: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isActive = status === 'active'

  function archive() {
    startTransition(async () => {
      await archiveEmployeeAction(employeeId)
    })
  }

  function restore() {
    startTransition(async () => {
      await restoreEmployeeAction(employeeId)
    })
  }

  function hardDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    startTransition(async () => {
      await deleteEmployeeAction(employeeId)
    })
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Duzenle
          </DropdownMenuItem>

          {isActive ? (
            <DropdownMenuItem onClick={archive}>
              <Archive className="h-4 w-4" />
              Pasife Al
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={restore}>
                <RotateCcw className="h-4 w-4" />
                Tekrar Isle Al
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={hardDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {confirmDelete ? 'Emin misin? Tekrar tikla' : 'Kalici Sil'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
