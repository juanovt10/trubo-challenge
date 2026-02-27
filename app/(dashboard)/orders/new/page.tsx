"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { z } from "zod"
import { Plus, Upload, Trash2, CalendarIcon, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { products, feeSchedules, orders } from "@/lib/mock-data"
import type { Product, Order } from "@/lib/mock-data"

const PAYERS = ["Medicare", "BCBS", "Aetna"] as const
const ORDER_ATTACHMENTS_KEY = "medsupply-order-attachments"
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 // 4MB per file
const ACCEPTED_TYPES = "application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

type StoredAttachment = { id: string; name: string; type: string; size: number; content: string }

function getOrderAttachments(orderId: string): StoredAttachment[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(ORDER_ATTACHMENTS_KEY)
    const data = raw ? (JSON.parse(raw) as Record<string, StoredAttachment[]>) : {}
    return Array.isArray(data[orderId]) ? data[orderId] : []
  } catch {
    return []
  }
}

function setOrderAttachments(orderId: string, attachments: StoredAttachment[]) {
  if (typeof window === "undefined") return
  try {
    const raw = sessionStorage.getItem(ORDER_ATTACHMENTS_KEY)
    const data = raw ? (JSON.parse(raw) as Record<string, StoredAttachment[]>) : {}
    data[orderId] = attachments
    sessionStorage.setItem(ORDER_ATTACHMENTS_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.includes(",") ? result.split(",")[1] ?? "" : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function createOrderSchema(selfPay: boolean) {
  const base = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    dob: z.date({ required_error: "Date of birth is required" }),
    phone: z
      .string()
      .min(1, "Phone is required")
      .refine((v) => /^\d+$/.test(v.replace(/\D/g, "")), "Phone must be a number"),
    insuranceId: z.string().optional(),
    payer: z.string().optional(),
    groupNumber: z
      .string()
      .optional()
      .refine((v) => v === undefined || v === "" || /^\d+$/.test(v.replace(/\D/g, "")), "Group number must be a number"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z
      .string()
      .min(1, "ZIP is required")
      .refine((v) => /^\d+$/.test(v.replace(/\D/g, "")), "ZIP must be a number"),
    lineItems: z
      .array(z.object({ productId: z.string() }))
      .min(1, "Add at least one line item")
      .refine((arr) => arr.every((i) => i.productId.length > 0), "Each line item must have a product selected"),
  })
  if (selfPay) return base
  return base.extend({
    insuranceId: z.string().min(1, "Insurance ID is required"),
    payer: z.enum(PAYERS, { required_error: "Payer is required" }),
    groupNumber: z
      .string()
      .min(1, "Group number is required")
      .refine((v) => /^\d+$/.test(v.replace(/\D/g, "")), "Group number must be a number"),
  })
}

type OrderFormErrors = Partial<Record<string, string>>

interface NewLineItem {
  id: string
  productId: string
  product: string
  hcpcs: string
  qty: number
  cost: number
  allowedAmount: number
  patientShare: number
}

function getPricingForProduct(
  product: Pick<Product, "hcpcs" | "msrp">,
  selfPay: boolean,
  payer: string
): { allowedAmount: number; patientShare: number } {
  if (selfPay) {
    return { allowedAmount: product.msrp, patientShare: product.msrp }
  }
  if (!payer) {
    return { allowedAmount: 0, patientShare: 0 }
  }
  const fs = feeSchedules.find(
    (f) => f.payer === payer && f.hcpcs === product.hcpcs
  )
  if (!fs) {
    return { allowedAmount: 0, patientShare: 0 }
  }
  const patientShare = fs.allowedAmount * (fs.patientSharePercent / 100)
  return { allowedAmount: fs.allowedAmount, patientShare }
}

function recalcLineItemPricing(
  items: NewLineItem[],
  selfPay: boolean,
  payer: string
): NewLineItem[] {
  return items.map((li) => {
    if (!li.productId) return li
    const product = products.find((p) => p.id === li.productId)
    if (!product) return li
    const { allowedAmount, patientShare } = getPricingForProduct(
      product,
      selfPay,
      payer
    )
    return { ...li, allowedAmount, patientShare }
  })
}

function CreateOrderPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selfPay, setSelfPay] = useState(false)
  const [payer, setPayer] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
  const [lineItems, setLineItems] = useState<NewLineItem[]>([])
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [insuranceId, setInsuranceId] = useState("")
  const [groupNumber, setGroupNumber] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [errors, setErrors] = useState<OrderFormErrors>({})
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
  const [summaryOrder, setSummaryOrder] = useState<Order | null>(null)
  const [hasPrefilled, setHasPrefilled] = useState(false)
  const [noFeeDialogOpen, setNoFeeDialogOpen] = useState(false)
  const [noFeeDialogLineItem, setNoFeeDialogLineItem] = useState<{
    id: string
    payer: string
    product: string
    hcpcs: string
  } | null>(null)
  const [attachments, setAttachments] = useState<StoredAttachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const continueId = searchParams.get("continue")
    if (!continueId || hasPrefilled) return
    const order = orders.find((o) => o.id.toLowerCase() === continueId.toLowerCase())
    if (!order) return
    const timer = setTimeout(() => {
      const nameParts = order.patient.trim().split(/\s+/)
      setFirstName(nameParts[0] ?? "")
      setLastName(nameParts.slice(1).join(" ") ?? "")
      setPhone(order.phone ?? "")
      setAddress(order.address ?? "")
      setCity(order.city ?? "")
      setState(order.state ?? "")
      setZip(order.zip ?? "")
      setSelfPay(order.selfPay)
      setPayer(order.selfPay ? "" : order.payer)
      setInsuranceId(order.insuranceId ?? "")
      setGroupNumber(order.groupNumber === "N/A" ? "" : (order.groupNumber ?? ""))
      if (order.dob) {
        const d = new Date(order.dob)
        if (!Number.isNaN(d.getTime())) setDateOfBirth(d)
      }
      const items: NewLineItem[] = order.lineItems.map((li, idx) => {
        const product = products.find(
          (p) => p.name === li.product || p.hcpcs === li.hcpcs
        )
        return {
          id: `new-${Date.now()}-${idx}`,
          productId: product?.id ?? "",
          product: li.product,
          hcpcs: li.hcpcs,
          qty: li.qty,
          cost: li.cost,
          allowedAmount: li.allowedAmount,
          patientShare: li.patientShare,
        }
      })
      setLineItems(items)
      const stored = getOrderAttachments(continueId)
      setAttachments(stored)
      setHasPrefilled(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [searchParams, hasPrefilled])

  async function processFiles(files: FileList | null) {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File too large: ${file.name} (max 4MB)`)
        continue
      }
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!["pdf", "doc", "docx"].includes(ext ?? "")) {
        toast.error(`${file.name}: PDF or Word only`)
        continue
      }
      try {
        const content = await readFileAsBase64(file)
        setAttachments((prev) => [
          ...prev,
          { id: `att-${Date.now()}-${prev.length}`, name: file.name, type: file.type, size: file.size, content },
        ])
      } catch {
        toast.error(`Failed to read ${file.name}`)
      }
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
    e.dataTransfer.clearData()
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function addLineItem() {
    clearError("lineItems")
    setLineItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        productId: "",
        product: "",
        hcpcs: "",
        qty: 1,
        cost: 0,
        allowedAmount: 0,
        patientShare: 0,
      },
    ])
  }

  function updateLineItem(id: string, productId: string) {
    clearError("lineItems")
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const { allowedAmount, patientShare } = getPricingForProduct(
      product,
      selfPay,
      payer
    )
    setLineItems((prev) =>
      prev.map((li) =>
        li.id === id
          ? {
              ...li,
              productId,
              product: product.name,
              hcpcs: product.hcpcs,
              cost: product.cost,
              allowedAmount,
              patientShare,
            }
          : li
      )
    )
    if (!selfPay && payer && allowedAmount === 0) {
      setNoFeeDialogLineItem({ id, payer, product: product.name, hcpcs: product.hcpcs })
      setNoFeeDialogOpen(true)
    }
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((li) => li.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      firstName,
      lastName,
      dob: dateOfBirth,
      phone,
      insuranceId: selfPay ? undefined : insuranceId,
      payer: selfPay ? undefined : payer,
      groupNumber: selfPay ? undefined : groupNumber,
      address,
      city,
      state,
      zip,
      lineItems: lineItems.map((li) => ({ productId: li.productId })),
    }
    const schema = createOrderSchema(selfPay)
    const result = schema.safeParse(payload)
    if (!result.success) {
      const fieldErrors: OrderFormErrors = {}
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string
        if (path && !fieldErrors[path]) fieldErrors[path] = err.message
      })
      setErrors(fieldErrors)
      const messages = result.error.errors.map((e) => e.message)
      const unique = [...new Set(messages)]
      toast.error("Please fix the form", {
        description: unique.slice(0, 5).join(". ") + (unique.length > 5 ? " …" : ""),
      })
      return
    }
    setErrors({})

    const totalCost = lineItems.reduce((sum, li) => sum + li.cost * li.qty, 0)
    const margin =
      totalCost > 0
        ? Math.round(((totalAllowed - totalCost) / totalCost) * 1000) / 10
        : 0

    const anyItemRequiresApproval = lineItems.some((li) => {
      const product = products.find((p) => p.id === li.productId)
      return product?.requiresApproval ?? false
    })
    const initialStatus = anyItemRequiresApproval ? "Needs Approval" : "Approved"

    const newOrder: Order = {
      id: "—",
      patient: `${firstName} ${lastName}`.trim(),
      payer: selfPay ? "Self-Pay" : payer,
      status: initialStatus,
      totalAllowed,
      margin,
      updated: format(new Date(), "yyyy-MM-dd"),
      selfPay,
      address,
      city,
      state,
      zip,
      phone,
      dob: dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : "",
      insuranceId: selfPay ? "" : insuranceId,
      groupNumber: selfPay ? "N/A" : groupNumber,
      lineItems: lineItems.map((li, idx) => {
        const product = products.find((p) => p.id === li.productId)
        return {
          id: `LI-${idx + 1}`,
          product: li.product,
          hcpcs: li.hcpcs,
          qty: li.qty,
          cost: li.cost,
          allowedAmount: li.allowedAmount,
          patientShare: li.patientShare,
          hasMeasurement: product?.requiresMeasurement ?? false,
        }
      }),
      notes: [],
    }

    const continueId = searchParams.get("continue")
    if (continueId && attachments.length > 0) setOrderAttachments(continueId, attachments)
    setSummaryOrder(newOrder)
  }

  function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault()
    const totalAllowed = lineItems.reduce((sum, li) => sum + li.allowedAmount * li.qty, 0)
    const totalCost = lineItems.reduce((sum, li) => sum + li.cost * li.qty, 0)
    const margin =
      totalCost > 0
        ? Math.round(((totalAllowed - totalCost) / totalCost) * 1000) / 10
        : 0

    const draftOrder: Order = {
      id: "—",
      patient: `${firstName} ${lastName}`.trim() || "—",
      payer: selfPay ? "Self-Pay" : payer || "—",
      status: "Draft",
      totalAllowed,
      margin,
      updated: format(new Date(), "yyyy-MM-dd"),
      selfPay,
      address: address || "—",
      city: city || "—",
      state: state || "—",
      zip: zip || "—",
      phone: phone || "—",
      dob: dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : "—",
      insuranceId: selfPay ? "" : insuranceId,
      groupNumber: selfPay ? "N/A" : groupNumber,
      lineItems: lineItems.map((li, idx) => {
        const product = products.find((p) => p.id === li.productId)
        return {
          id: `LI-${idx + 1}`,
          product: li.product || "—",
          hcpcs: li.hcpcs || "—",
          qty: li.qty,
          cost: li.cost,
          allowedAmount: li.allowedAmount,
          patientShare: li.patientShare,
          hasMeasurement: product?.requiresMeasurement ?? false,
        }
      }),
      notes: [],
    }

    const continueId = searchParams.get("continue")
    if (continueId && attachments.length > 0) setOrderAttachments(continueId, attachments)
    setSummaryOrder(draftOrder)
  }

  const totalAllowed = lineItems.reduce((sum, li) => sum + li.allowedAmount * li.qty, 0)

  function clearLineItemAndCloseNoFeeDialog() {
    if (!noFeeDialogLineItem) return
    setLineItems((prev) =>
      prev.map((li) =>
        li.id === noFeeDialogLineItem.id
          ? {
              ...li,
              productId: "",
              product: "",
              hcpcs: "",
              cost: 0,
              allowedAmount: 0,
              patientShare: 0,
            }
          : li
      )
    )
    setNoFeeDialogOpen(false)
    setNoFeeDialogLineItem(null)
  }

  function saveDraftAndGoToFeeSchedule() {
    const combo = noFeeDialogLineItem
    const draft = {
      firstName,
      lastName,
      dob: dateOfBirth ? dateOfBirth.toISOString() : null,
      phone,
      selfPay,
      payer,
      insuranceId,
      groupNumber,
      address,
      city,
      state,
      zip,
      lineItems: lineItems.map((li) => ({
        id: li.id,
        productId: li.productId,
        product: li.product,
        hcpcs: li.hcpcs,
        qty: li.qty,
        cost: li.cost,
        allowedAmount: li.allowedAmount,
        patientShare: li.patientShare,
      })),
    }
    try {
      sessionStorage.setItem("orderDraft", JSON.stringify(draft))
    } catch {
      // ignore
    }
    setNoFeeDialogOpen(false)
    setNoFeeDialogLineItem(null)
    const params = new URLSearchParams()
    if (combo) {
      params.set("payer", combo.payer)
      params.set("hcpcs", combo.hcpcs)
    }
    router.push(`/fee-schedules${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
      <h1 className="shrink-0 text-xl font-semibold text-foreground">Create Order</h1>

      {/* Patient Information */}
      <Card className="border border-border bg-card py-4 shadow-none">
        <CardHeader className="pb-1.5">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <Input
                placeholder="First name"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearError("firstName") }}
                className={cn("h-8 bg-background text-sm", errors.firstName && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearError("lastName") }}
                className={cn("h-8 bg-background text-sm", errors.lastName && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-8 justify-start bg-background text-left text-sm font-normal",
                      !dateOfBirth && "text-muted-foreground",
                      errors.dob && "border-red-500 focus-visible:ring-red-500"
                    )}
                    onClick={() => clearError("dob")}
                  >
                    <CalendarIcon className="mr-2 size-3.5" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={(d) => { setDateOfBirth(d); clearError("dob") }}
                    disabled={(date) => date > new Date()}
                    captionLayout="dropdown"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); clearError("phone") }}
                className={cn("h-8 bg-background text-sm", errors.phone && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card className="border border-border bg-card py-4 shadow-none">
        <CardHeader className="pb-1.5">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Insurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Self-Pay</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selfPay}
                  onCheckedChange={(checked) => {
                    setSelfPay(checked)
                    setLineItems((prev) =>
                      recalcLineItemPricing(prev, checked, payer)
                    )
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {selfPay ? "Yes" : "No"}
                </span>
              </div>
            </div>
            {!selfPay && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Payer</Label>
                  <Select
                    value={payer}
                    onValueChange={(value) => {
                      setPayer(value)
                      clearError("payer")
                      setLineItems((prev) =>
                        recalcLineItemPricing(prev, selfPay, value)
                      )
                    }}
                  >
                    <SelectTrigger
                      className={cn("h-8 bg-background text-sm", errors.payer && "border-red-500 focus-visible:ring-red-500")}
                    >
                      <SelectValue placeholder="Select payer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Medicare">Medicare</SelectItem>
                      <SelectItem value="BCBS">BCBS</SelectItem>
                      <SelectItem value="Aetna">Aetna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Insurance ID</Label>
                  <Input
                    placeholder="Insurance ID"
                    value={insuranceId}
                    onChange={(e) => { setInsuranceId(e.target.value); clearError("insuranceId") }}
                    className={cn("h-8 bg-background text-sm", errors.insuranceId && "border-red-500 focus-visible:ring-red-500")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Group Number</Label>
                  <Input
                    placeholder="Group number"
                    value={groupNumber}
                    onChange={(e) => { setGroupNumber(e.target.value); clearError("groupNumber") }}
                    className={cn("h-8 bg-background text-sm", errors.groupNumber && "border-red-500 focus-visible:ring-red-500")}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card className="border border-border bg-card py-4 shadow-none">
        <CardHeader className="pb-1.5">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shipping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Address</Label>
              <Input
                placeholder="Street address"
                value={address}
                onChange={(e) => { setAddress(e.target.value); clearError("address") }}
                className={cn("h-8 bg-background text-sm", errors.address && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input
                placeholder="City"
                value={city}
                onChange={(e) => { setCity(e.target.value); clearError("city") }}
                className={cn("h-8 bg-background text-sm", errors.city && "border-red-500 focus-visible:ring-red-500")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">State</Label>
                <Input
                  placeholder="State"
                  value={state}
                  onChange={(e) => { setState(e.target.value); clearError("state") }}
                  className={cn("h-8 bg-background text-sm", errors.state && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">ZIP</Label>
                <Input
                  placeholder="ZIP"
                  value={zip}
                  onChange={(e) => { setZip(e.target.value); clearError("zip") }}
                  className={cn("h-8 bg-background text-sm", errors.zip && "border-red-500 focus-visible:ring-red-500")}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card
        className={cn(
          "border bg-card py-4 shadow-none",
          errors.lineItems ? "border-red-500" : "border-border"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-1.5">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Line Items
          </CardTitle>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addLineItem}>
            <Plus className="mr-1 size-3" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <>
              <p className="py-6 text-center text-sm text-muted-foreground">
                {"No items added yet. Click \"Add Item\" to begin."}
              </p>
              {errors.lineItems && (
                <p className="text-center text-sm text-red-500">{errors.lineItems}</p>
              )}
            </>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Product</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">HCPCS</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Qty</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cost</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Allowed</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pt. Share</TableHead>
                    <TableHead className="w-20 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Meas.</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((li) => (
                    <TableRow key={li.id}>
                      <TableCell>
                        <Select
                          value={li.productId}
                          onValueChange={(val) => updateLineItem(li.id, val)}
                        >
                          <SelectTrigger className="h-7 w-52 bg-background text-xs">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{li.hcpcs || "\u2014"}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={1}
                          value={li.qty}
                          onChange={(e) =>
                            setLineItems((prev) =>
                              prev.map((item) =>
                                item.id === li.id
                                  ? { ...item, qty: parseInt(e.target.value) || 1 }
                                  : item
                              )
                            )
                          }
                          className="h-7 w-14 bg-background text-right text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {li.cost > 0 ? `$${li.cost.toFixed(2)}` : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-foreground">
                        {li.allowedAmount > 0 ? `$${(li.allowedAmount * li.qty).toFixed(2)}` : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {li.patientShare > 0 ? `$${(li.patientShare * li.qty).toFixed(2)}` : "\u2014"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const product = li.productId
                            ? products.find((p) => p.id === li.productId)
                            : null
                          const requiresMeasurement = product?.requiresMeasurement ?? false
                          if (requiresMeasurement) {
                            return (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[11px] text-muted-foreground"
                                onClick={() => setMeasurementDialogOpen(true)}
                              >
                                <Upload className="mr-1 size-3" />
                                Upload
                              </Button>
                            )
                          }
                          return (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-foreground"
                          onClick={() => removeLineItem(li.id)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {lineItems.length > 0 && (errors.lineItems ? (
            <p className="mt-2 text-sm text-red-500">{errors.lineItems}</p>
          ) : null)}
          {lineItems.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="text-sm text-muted-foreground">
                Total Allowed:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  ${totalAllowed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments — below Line Items */}
      <Card className="border border-border bg-card shadow-none">
        <CardHeader className="pb-1.5 pt-4 px-6">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="sr-only"
            onChange={handleFileSelect}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }}
            onDrop={handleDrop}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click() } }}
            className={cn(
              "flex w-full min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50"
            )}
          >
            <Upload className="mb-2 size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Drop files here" : "Drag and drop PDF or Word files here, or click to browse"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">PDF or Word only, max 4MB per file</p>
          </div>
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Attached files</p>
              <ul className="space-y-2">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">{att.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); removeAttachment(att.id) }}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/orders")}>
          Cancel
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft}>
          Save as draft
        </Button>
        <Button type="submit" size="sm">Create Order</Button>
      </div>

      <Dialog open={measurementDialogOpen} onOpenChange={setMeasurementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Measurement upload</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Coming soon. This will be part of the next sprint.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog
        open={noFeeDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNoFeeDialogOpen(false)
            setNoFeeDialogLineItem(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg sm:min-w-[26rem]">
          <DialogHeader>
            <DialogTitle>No fee schedule</DialogTitle>
          </DialogHeader>
          {noFeeDialogLineItem && (
            <>
              <p className="text-sm text-muted-foreground">
                This product does not have a fee schedule set up for{" "}
                <span className="font-medium text-foreground">{noFeeDialogLineItem.payer}</span>.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium text-foreground break-words">{noFeeDialogLineItem.product}</p>
                <p className="text-muted-foreground mt-0.5">HCPCS: {noFeeDialogLineItem.hcpcs}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={clearLineItemAndCloseNoFeeDialog}>
                  Close & clear line item
                </Button>
                <Button type="button" size="sm" className="whitespace-normal text-left" onClick={saveDraftAndGoToFeeSchedule}>
                  Save as draft & create fee schedule
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!summaryOrder} onOpenChange={(open) => !open && setSummaryOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Order summary{summaryOrder?.status === "Draft" ? " (Draft)" : ""}
            </DialogTitle>
          </DialogHeader>
          {summaryOrder && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-muted-foreground">Patient</span>
                <span className="font-medium text-foreground">{summaryOrder.patient}</span>
                <span className="text-muted-foreground">Payer</span>
                <span className="text-foreground">{summaryOrder.payer}</span>
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground">{summaryOrder.status}</span>
                <span className="text-muted-foreground">Address</span>
                <span className="text-foreground">
                  {summaryOrder.address}, {summaryOrder.city}, {summaryOrder.state} {summaryOrder.zip}
                </span>
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground">{summaryOrder.phone}</span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Line items</p>
                <ul className="space-y-1 text-sm text-foreground">
                  {summaryOrder.lineItems.map((li) => (
                    <li key={li.id}>
                      {li.product} × {li.qty} — ${(li.allowedAmount * li.qty).toFixed(2)} allowed
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  Total allowed:{" "}
                  <span className="font-semibold tabular-nums">
                    ${summaryOrder.totalAllowed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                Saving into DB coming in next version.
              </p>
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setSummaryOrder(null)
                    router.push("/orders")
                  }}
                >
                  Go to Orders
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </form>
  )
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <CreateOrderPageContent />
    </Suspense>
  )
}
