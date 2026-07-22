'use client'

import { useState, useTransition } from 'react'
import {
  Check,
  X,
  Trash2,
  Ban,
  MoreHorizontal,
} from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@hrms/ui'
import {
  approveLeaveAction,
  rejectLeaveAction,
  cancelLeaveAction,
  hardDeleteLeaveAction,
} from '@/app/(dashboard)/leaves/actions'

export function LeaveStatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const map = {
    pending: { variant: 'warning' as const, label: 'Bekleyen' },
    approved: { variant: 'success' as const, label: 'Onayli' },
    rejected: { variant: 'destructive' as const, label: 'Reddedildi' },
  }
  const m = map[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function LeaveRowActions({
  leaveId,
  status,
  isStaff,
}: {
  leaveId: string
  status: 'pending' | 'approved' | 'rejected'
  isStaff: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmHardDelete, setConfirmHardDelete] = useState(false)

  function approve() {
    startTransition(async () => {
      await approveLeaveAction(leaveId)
    })
  }
  function reject() {
    startTransition(async () => {
      await rejectLeaveAction(leaveId)
    })
  }
  function cancel() {
    startTransition(async () => {
      await cancelLeaveAction(leaveId)
    })
  }
  function hardDelete() {
    if (!confirmHardDelete) {
      setConfirmHardDelete(true)
      setTimeout(() => setConfirmHardDelete(false), 3000)
      return
    }
    startTransition(async () => {
      await hardDeleteLeaveAction(leaveId)
    })
  }

  const isPendingStatus = status === 'pending'

  return (
    <div className="flex items-center justify-end gap-1">
      {isStaff && isPendingStatus && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={approve}
            disabled={isPending}
            title="Onayla"
          >
            <Check className="h-4 w-4 text-emerald-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={reject}
            disabled={isPending}
            title="Reddet"
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </>
      )}

      {!isStaff && isPendingStatus && (
        <Button
          variant="ghost"
          size="icon"
          onClick={cancel}
          disabled={isPending}
          title="Iptal"
        >
          <Ban className="h-4 w-4" />
        </Button>
      )}

      {isStaff && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isPendingStatus && (
              <DropdownMenuItem onClick={cancel}>
                <Ban className="h-4 w-4" />
                Iptal Et
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={hardDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {confirmHardDelete ? 'Emin misin? Tekrar tikla' : 'Kalici Sil'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
