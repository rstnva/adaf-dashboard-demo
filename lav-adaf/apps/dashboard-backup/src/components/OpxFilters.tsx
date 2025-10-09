'use client'

import { Suspense } from 'react'
import OpxFiltersInner from './OpxFiltersInner'

type OpxFiltersProps = {
  onFiltersChange: (filters: {
    status: string
    type: string
    q: string
    order: string
    dir: string
    limit: number
    page: number
  }) => void
  onToast: (message: string, isError?: boolean) => void
}

function OpxFiltersLoader() {
  return (
    <div className="p-4 border rounded-lg bg-muted/50 animate-pulse">
      <div className="h-8 bg-muted-foreground/20 rounded mb-4 max-w-[200px]"></div>
      <div className="flex gap-4 flex-wrap">
        <div className="h-10 bg-muted-foreground/20 rounded w-32"></div>
        <div className="h-10 bg-muted-foreground/20 rounded w-32"></div>
        <div className="h-10 bg-muted-foreground/20 rounded w-48"></div>
        <div className="h-10 bg-muted-foreground/20 rounded w-32"></div>
      </div>
    </div>
  )
}

export default function OpxFilters(props: OpxFiltersProps) {
  return (
    <Suspense fallback={<OpxFiltersLoader />}>
      <OpxFiltersInner {...props} />
    </Suspense>
  )
}