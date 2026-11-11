"use client"

import * as React from "react"

import { Pagination } from "@workspace/ui/components/pagination"

export function PaginationControlledDemo() {
  const [page, setPage] = React.useState(6)
  return (
    <Pagination
      page={page}
      onPageChange={setPage}
      pageCount={6}
      pageSize={25}
      totalCount={128}
      noun="articles"
    />
  )
}
