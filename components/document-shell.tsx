"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentShellProps {
  orderId: string
  children: React.ReactNode
}

export function DocumentShell({ orderId, children }: DocumentShellProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push(`/orders/${orderId}`)}
        >
          <ArrowLeft className="mr-1.5 size-3" />
          Back to Order
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
          Export PDF (Phase 2)
        </Button>
      </div>
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-10 print:border-0 print:shadow-none">
        {children}
      </div>
    </div>
  )
}
