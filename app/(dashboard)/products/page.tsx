"use client"

import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { products } from "@/lib/mock-data"

const addProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  hcpcs: z.string().min(1, "HCPCS code is required"),
  vendor: z.string().min(1, "Vendor is required"),
  cost: z.string().min(1, "Cost is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Cost must be a number ≥ 0"),
  msrp: z.string().min(1, "MSRP is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "MSRP must be a number ≥ 0"),
  requiresApproval: z.boolean(),
  requiresMeasurement: z.boolean(),
})

type AddProductErrors = Partial<Record<keyof z.infer<typeof addProductSchema>, string>>

export default function ProductsPage() {
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [name, setName] = useState("")
  const [hcpcs, setHcpcs] = useState("")
  const [vendor, setVendor] = useState("")
  const [cost, setCost] = useState("")
  const [msrp, setMsrp] = useState("")
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [requiresMeasurement, setRequiresMeasurement] = useState(false)
  const [errors, setErrors] = useState<AddProductErrors>({})
  const [successSummary, setSuccessSummary] = useState<z.infer<typeof addProductSchema> | null>(null)

  function clearError(field: keyof AddProductErrors) {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function handleAddProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = addProductSchema.safeParse({
      name,
      hcpcs,
      vendor,
      cost,
      msrp,
      requiresApproval,
      requiresMeasurement,
    })
    if (!result.success) {
      const fieldErrors: AddProductErrors = {}
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof AddProductErrors
        if (path && !fieldErrors[path]) fieldErrors[path] = err.message
      })
      setErrors(fieldErrors)
      const messages = result.error.errors.map((e) => e.message)
      toast.error("Please fix the form", {
        description: [...new Set(messages)].slice(0, 4).join(". "),
      })
      return
    }
    setErrors({})
    setAddProductOpen(false)
    setSuccessSummary({
      name,
      hcpcs,
      vendor,
      cost,
      msrp,
      requiresApproval,
      requiresMeasurement,
    })
    setName("")
    setHcpcs("")
    setVendor("")
    setCost("")
    setMsrp("")
    setRequiresApproval(false)
    setRequiresMeasurement(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Products</h1>
        <Button size="sm" onClick={() => setAddProductOpen(true)}>
          <Plus className="mr-1.5 size-3.5" />
          Add Product
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Product Name</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">HCPCS Code</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vendor</TableHead>
              <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cost</TableHead>
              <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">MSRP</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Approval</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Measurement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="transition-colors hover:bg-accent/50">
                <TableCell className="text-sm font-medium text-foreground">
                  {product.name}
                </TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {product.hcpcs}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{product.vendor}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  ${product.cost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-foreground">
                  ${product.msrp.toFixed(2)}
                </TableCell>
                <TableCell>
                  {product.requiresApproval ? (
                    <Badge variant="outline" className="text-[11px] font-medium">
                      Required
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.requiresMeasurement ? (
                    <button
                      type="button"
                      onClick={() => setMeasurementModalOpen(true)}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    >
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium cursor-pointer hover:opacity-90"
                      >
                        Required
                      </Badge>
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={measurementModalOpen} onOpenChange={setMeasurementModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Measurement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Feature coming soon. This will be part of the next sprint.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={addProductOpen} onOpenChange={(open) => { setAddProductOpen(open); if (!open) setErrors({}); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProductSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Product name</Label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); clearError("name"); }}
                placeholder="e.g. Power Wheelchair – Group 2"
                className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">HCPCS code</Label>
              <Input
                value={hcpcs}
                onChange={(e) => { setHcpcs(e.target.value); clearError("hcpcs"); }}
                placeholder="e.g. K0823"
                className={cn(errors.hcpcs && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Vendor</Label>
              <Input
                value={vendor}
                onChange={(e) => { setVendor(e.target.value); clearError("vendor"); }}
                placeholder="e.g. Sunrise Medical"
                className={cn(errors.vendor && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Cost ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cost}
                  onChange={(e) => { setCost(e.target.value); clearError("cost"); }}
                  placeholder="0.00"
                  className={cn(errors.cost && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">MSRP ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={msrp}
                  onChange={(e) => { setMsrp(e.target.value); clearError("msrp"); }}
                  placeholder="0.00"
                  className={cn(errors.msrp && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">Requires approval</Label>
              <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm">Requires measurement</Label>
              <Switch checked={requiresMeasurement} onCheckedChange={setRequiresMeasurement} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddProductOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">Add Product</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!successSummary} onOpenChange={(open) => !open && setSuccessSummary(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Product summary</DialogTitle>
          </DialogHeader>
          {successSummary && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-muted-foreground">Product name</span>
                <span className="font-medium text-foreground">{successSummary.name}</span>
                <span className="text-muted-foreground">HCPCS code</span>
                <span className="font-mono text-foreground">{successSummary.hcpcs}</span>
                <span className="text-muted-foreground">Vendor</span>
                <span className="text-foreground">{successSummary.vendor}</span>
                <span className="text-muted-foreground">Cost</span>
                <span className="tabular-nums text-foreground">${Number(successSummary.cost).toFixed(2)}</span>
                <span className="text-muted-foreground">MSRP</span>
                <span className="tabular-nums text-foreground">${Number(successSummary.msrp).toFixed(2)}</span>
                <span className="text-muted-foreground">Requires approval</span>
                <span className="text-foreground">{successSummary.requiresApproval ? "Yes" : "No"}</span>
                <span className="text-muted-foreground">Requires measurement</span>
                <span className="text-foreground">{successSummary.requiresMeasurement ? "Yes" : "No"}</span>
              </div>
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                Adding products will be added in the next version.
              </p>
              <div className="flex justify-end pt-2">
                <Button type="button" size="sm" onClick={() => setSuccessSummary(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
