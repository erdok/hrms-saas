'use client'

import { useState, useTransition } from 'react'
import {
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
  Textarea,
} from '@hrms/ui'
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  saveTemplateAction,
  deleteTemplateAction,
} from '@/app/dashboard/templates/actions'

export interface TemplateItem {
  id: string
  name: string
  content: string
  created_at: string
}

export function TemplateList({ templates }: { templates: TemplateItem[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{templates.length} sablon</h2>
        <TemplateEditorDialog
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Yeni
            </Button>
          }
        />
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sablon yok"
          description="Belgeleme altyapisini kullanmak icin en az bir sablon olusturun."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{t.name}</h3>
                <div className="flex gap-1">
                  <TemplateEditorDialog
                    template={t}
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteButton id={t.id} />
                </div>
              </div>
              <p className="mt-2 line-clamp-4 text-xs text-muted-foreground whitespace-pre-wrap">
                {t.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateEditorDialog({
  template,
  trigger,
}: {
  template?: TemplateItem
  trigger: React.ReactNode
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
        await saveTemplateAction(fd, template?.id)
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kayit basarisiz')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Sablon Duzenle' : 'Yeni Sablon'}</DialogTitle>
          <DialogDescription>
            HTML destekli. Etiketler iki ayrikli isaretler arasina alinir, ornegin
            <code className="ml-1">{`{{name}}`}</code>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Sablon Adi</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={template?.name}
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Icerik</Label>
            <Textarea
              id="content"
              name="content"
              required
              defaultValue={template?.content}
              rows={12}
              className="font-mono text-xs"
              placeholder="<h1>IS SOZLESMESI</h1>Isveren ve Isci {{name}} arasinda..."
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Iptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function onDelete() {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
      return
    }
    startTransition(async () => {
      await deleteTemplateAction(id)
    })
  }
  return (
    <Button variant="ghost" size="icon" onClick={onDelete} disabled={isPending}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  )
}
