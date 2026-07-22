'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@hrms/ui'
import { DepartmentRow } from './types'
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from '@/app/(dashboard)/departments/actions'

export interface DepartmentListProps {
  departments: DepartmentRow[]
  // dept.id -> children count or employee count
  counts?: Record<string, number>
}

export function DepartmentList({ departments, counts = {} }: DepartmentListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Departmanlar</h2>
        <NewDepartmentDialog departments={departments} />
      </div>

      {departments.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Departman yok"
          description="Ilk departmaninizi ekleyerek baslayin."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Departman</TableHead>
                <TableHead>Ust Departman</TableHead>
                <TableHead>Aktif Personel</TableHead>
                <TableHead className="w-32 text-right">Islemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => {
                const parent = departments.find((p) => p.id === d.parent_id)
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>
                      {parent ? (
                        <Badge variant="outline">{parent.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{counts[d.id] ?? 0} kisi</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <EditDepartmentDialog
                          department={d}
                          departments={departments.filter((x) => x.id !== d.id)}
                        />
                        <DeleteDepartmentButton
                          id={d.id}
                          count={counts[d.id] ?? 0}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function NewDepartmentDialog({
  departments,
}: {
  departments: DepartmentRow[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createDepartmentAction(fd)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Basarisiz')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Yeni
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Departman</DialogTitle>
          <DialogDescription>
            Departman adi sirketinizde benzersiz olmali.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Departman Adi</Label>
            <Input id="name" name="name" required maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentId">Ust Departman (opsiyonel)</Label>
            <Select id="parentId" name="parentId" defaultValue="">
              <option value="">- YOK -</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Iptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditDepartmentDialog({
  department,
  departments,
}: {
  department: DepartmentRow
  departments: DepartmentRow[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateDepartmentAction(department.id, fd)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Departmani Duzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Departman Adi</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={department.name}
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentId">Ust Departman</Label>
            <Select
              id="parentId"
              name="parentId"
              defaultValue={department.parent_id ?? ''}
            >
              <option value="">- YOK -</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Iptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Guncelle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDepartmentButton({
  id,
  count,
}: {
  id: string
  count: number
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    startTransition(async () => {
      await deleteDepartmentAction(id)
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onDelete}
      disabled={isPending}
      title={count > 0 ? 'Bu departmana bagli personeller var; yine de silebilirsiniz (baglanti kaldirilir).' : 'Sil'}
    >
      <Trash2 className="h-4 w-4" />
      {confirmDelete ? (
        <span className="ml-1 text-xs text-destructive">Emin?</span>
      ) : null}
    </Button>
  )
}
