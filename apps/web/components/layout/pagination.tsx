import Link from 'next/link'
import { Button } from '@hrms/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number
  totalPages: number
  basePath: string
}) {
  if (totalPages <= 1) return null

  const href = (p: number) => `${basePath}?page=${p}`

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" disabled={page <= 1} asChild>
        <Link href={href(Math.max(1, page - 1))} aria-label="Onceki sayfa">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>

      <Button variant="outline" size="icon" disabled={page >= totalPages} asChild>
        <Link href={href(Math.min(totalPages, page + 1))} aria-label="Sonraki sayfa">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
