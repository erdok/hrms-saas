import * as React from 'react'
import { cn } from '../utils/cn'

export function EmptyState({
  title,
  description,
  icon: Icon,
  className,
  children,
}: {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center',
        className,
      )}
    >
      {Icon ? (
        <Icon className="mb-3 h-10 w-10 text-muted-foreground/50" />
      ) : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}
