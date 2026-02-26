"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { feeSchedules, products } from "@/lib/mock-data"

const PAYERS = ["Medicare", "BCBS", "Aetna"] as const
const PATIENT_SHARE: Record<string, number> = { Medicare: 20, Aetna: 20, BCBS: 15 }

const addFeeScheduleSchema = z.object({
  payer: z.enum(PAYERS, { required_error: "Payer is required" }),
  productId: z.string().min(1, "Product is required"),
  allowedAmount: z.string().min(1, "Allowed amount is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Allowed amount must be a number ≥ 0"),
})

type AddFeeScheduleErrors = Partial<Record<keyof z.infer<typeof addFeeScheduleSchema>, string>>

function FeeSchedulesPageContent() {
  const searchParams = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const [payer, setPayer] = useState("")
  const [productId, setProductId] = useState("")
  const [allowedAmount, setAllowedAmount] = useState("")
  const [errors, setErrors] = useState<AddFeeScheduleErrors>({})
  const [successSummary, setSuccessSummary] = useState<{
    payer: string
    productName: string
    hcpcs: string
    allowedAmount: string
    patientSharePercent: number
  } | null>(null)

  const patientSharePercent = payer ? PATIENT_SHARE[payer] ?? 20 : null

  useEffect(() => {
    const qPayer = searchParams.get("payer")
    const qHcpcs = searchParams.get("hcpcs")
    if (!qPayer || !PAYERS.includes(qPayer as (typeof PAYERS)[number])) return
    const timer = setTimeout(() => {
      setPayer(qPayer)
      if (qHcpcs) {
        const product = products.find((p) => p.hcpcs === qHcpcs)
        if (product) setProductId(product.id)
      }
      setAddOpen(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [searchParams])

  function clearError(field: keyof AddFeeScheduleErrors) {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function handleAddFeeScheduleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = addFeeScheduleSchema.safeParse({ payer, productId, allowedAmount })
    if (!result.success) {
      const fieldErrors: AddFeeScheduleErrors = {}
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof AddFeeScheduleErrors
        if (path && !fieldErrors[path]) fieldErrors[path] = err.message
      })
      setErrors(fieldErrors)
      const messages = result.error.errors.map((e) => e.message)
      toast.error("Please fix the form", {
        description: [...new Set(messages)].slice(0, 3).join(". "),
      })
      return
    }
    setErrors({})
    setAddOpen(false)
    const product = products.find((p) => p.id === productId)
    setSuccessSummary({
      payer,
      productName: product?.name ?? "",
      hcpcs: product?.hcpcs ?? "",
      allowedAmount,
      patientSharePercent: patientSharePercent ?? 20,
    })
    setPayer("")
    setProductId("")
    setAllowedAmount("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Fee Schedules</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 size-3.5" />
          Add Fee Schedule
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Payer</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">HCPCS Code</TableHead>
              <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Allowed Amount</TableHead>
              <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Patient Share %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feeSchedules.map((fs) => (
              <TableRow key={fs.id} className="transition-colors hover:bg-accent/50">
                <TableCell className="text-sm font-medium text-foreground">{fs.payer}</TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">{fs.hcpcs}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-foreground">
                  ${fs.allowedAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {fs.patientSharePercent}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setErrors({}); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fee Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFeeScheduleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Payer</Label>
              <Select value={payer} onValueChange={(v) => { setPayer(v); clearError("payer"); }}>
                <SelectTrigger className={cn(errors.payer && "border-red-500 focus-visible:ring-red-500")}>
                  <SelectValue placeholder="Select payer" />
                </SelectTrigger>
                <SelectContent>
                  {PAYERS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Product</Label>
              <Select value={productId} onValueChange={(v) => { setProductId(v); clearError("productId"); }}>
                <SelectTrigger className={cn(errors.productId && "border-red-500 focus-visible:ring-red-500")}>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.hcpcs})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Allowed amount ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={allowedAmount}
                onChange={(e) => { setAllowedAmount(e.target.value); clearError("allowedAmount"); }}
                placeholder="0.00"
                className={cn(errors.allowedAmount && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
              <Label className="text-xs text-muted-foreground">Patient share % (automatic)</Label>
              <p className="text-sm font-medium text-foreground">
                {patientSharePercent != null ? `${patientSharePercent}%` : "—"}
                {payer && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {payer === "BCBS" ? "15% for BCBS" : "20% for Medicare & Aetna"}
                  </span>
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Add Fee Schedule</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!successSummary} onOpenChange={(open) => !open && setSuccessSummary(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fee schedule summary</DialogTitle>
          </DialogHeader>
          {successSummary && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-muted-foreground">Payer</span>
                <span className="font-medium text-foreground">{successSummary.payer}</span>
                <span className="text-muted-foreground">Product</span>
                <span className="text-foreground">{successSummary.productName}</span>
                <span className="text-muted-foreground">HCPCS code</span>
                <span className="font-mono text-foreground">{successSummary.hcpcs}</span>
                <span className="text-muted-foreground">Allowed amount</span>
                <span className="tabular-nums text-foreground">
                  ${Number(successSummary.allowedAmount).toFixed(2)}
                </span>
                <span className="text-muted-foreground">Patient share %</span>
                <span className="text-foreground">{successSummary.patientSharePercent}%</span>
              </div>
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                Adding fee schedules will be added in the next version.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function FeeSchedulesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <FeeSchedulesPageContent />
    </Suspense>
  )
}
