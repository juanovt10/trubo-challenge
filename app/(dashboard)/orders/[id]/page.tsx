"use client"

import { useState, use, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { FileText, Send, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { orders, products, mockOrderAttachments } from "@/lib/mock-data"
import type { OrderStatus, Note, OrderAttachmentDisplay } from "@/lib/mock-data"
import type { LineItem } from "@/lib/mock-data"

const DOCS_READY_IDS_KEY = "medsupply-docs-ready-order-ids"
const ORDER_ATTACHMENTS_KEY = "medsupply-order-attachments"
const REJECTED_ORDERS_KEY = "medsupply-rejected-orders"
type RejectedMap = Record<string, { rejectionReason: string }>

function getRejectedOrders(): RejectedMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(REJECTED_ORDERS_KEY)
    const data = raw ? (JSON.parse(raw) as RejectedMap) : {}
    return data && typeof data === "object" ? data : {}
  } catch {
    return {}
  }
}

function setOrderRejected(orderId: string, rejectionReason: string) {
  if (typeof window === "undefined") return
  try {
    const data = getRejectedOrders()
    data[orderId] = { rejectionReason }
    sessionStorage.setItem(REJECTED_ORDERS_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function getItemsRequiringApproval(lineItems: LineItem[]): LineItem[] {
  return lineItems.filter((li) =>
    products.some(
      (p) => (p.name === li.product || p.hcpcs === li.hcpcs) && p.requiresApproval
    )
  )
}

function getDocsReadyOrderIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(DOCS_READY_IDS_KEY)
    const ids = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

function setOrderDocsReady(orderId: string) {
  if (typeof window === "undefined") return
  try {
    const ids = getDocsReadyOrderIds()
    if (!ids.includes(orderId)) {
      ids.push(orderId)
      sessionStorage.setItem(DOCS_READY_IDS_KEY, JSON.stringify(ids))
    }
  } catch {
    // ignore
  }
}

function getOrderAttachments(orderId: string): OrderAttachmentDisplay[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(ORDER_ATTACHMENTS_KEY)
    const data = raw ? (JSON.parse(raw) as Record<string, OrderAttachmentDisplay[]>) : {}
    const stored = Array.isArray(data[orderId]) ? data[orderId] : []
    if (stored.length > 0) return stored
  } catch {
    // fall through to mock
  }
  const mockKey = Object.keys(mockOrderAttachments).find(
    (k) => k.toLowerCase() === orderId.toLowerCase()
  )
  return mockKey ? mockOrderAttachments[mockKey] : []
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const order = orders.find((o) => o.id.toLowerCase() === id.toLowerCase())
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "Draft")
  const [notes, setNotes] = useState<Note[]>(order?.notes ?? [])
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectedReasonDisplay, setRejectedReasonDisplay] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<OrderAttachmentDisplay[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (getDocsReadyOrderIds().includes(id)) setStatus("Docs Ready")
      const rejected = getRejectedOrders()[id]
      if (rejected) {
        setStatus("Action Required")
        setRejectedReasonDisplay(rejected.rejectionReason)
      } else if (order?.status === "Action Required" && order.rejectionReason) {
        setRejectedReasonDisplay(order.rejectionReason)
      }
      setAttachments(getOrderAttachments(order?.id ?? id))
    }, 0)
    return () => clearTimeout(timer)
  }, [id, order])

  const [newNote, setNewNote] = useState("")
  const itemsRequiringApproval = order ? getItemsRequiringApproval(order.lineItems) : []

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Order not found</p>
      </div>
    )
  }

  function handleApprove() {
    setStatus("Approved")
    toast.success("Order Approved")
  }

  function handleGenerateDocs() {
    setOrderDocsReady(id)
    setStatus("Docs Ready")
    toast.success("Docs generated")
  }

  function handleRejectSubmit() {
    const reason = rejectionReason.trim()
    if (!reason) {
      toast.error("Please provide a reason for rejection")
      return
    }
    setOrderRejected(id, reason)
    setStatus("Action Required")
    setRejectedReasonDisplay(reason)
    const note: Note = {
      id: `N-reject-${Date.now()}`,
      author: "Manager",
      text: `Order rejected: ${reason}`,
      timestamp: new Date().toISOString(),
    }
    setNotes((prev) => [...prev, note])
    setRejectionDialogOpen(false)
    setRejectionReason("")
    toast.success("Order rejected — action required")
  }

  function handleAddNote() {
    if (!newNote.trim()) return
    const note: Note = {
      id: `N-${Date.now()}`,
      author: "You",
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
    }
    setNotes((prev) => [...prev, note])
    setNewNote("")
  }

  const documents = [
    {
      title: "Encounter Form",
      description: "Clinical encounter documentation with diagnosis and prescription details.",
      href: `/orders/${id}/documents/encounter`,
    },
    {
      title: "Patient Invoice",
      description: "Itemized invoice for patient with allowed amounts and co-pay breakdown.",
      href: `/orders/${id}/documents/invoice`,
    },
    {
      title: "Proof of Delivery",
      description: "Delivery confirmation form with patient acknowledgment and signature.",
      href: `/orders/${id}/documents/pod`,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{order.id}</h1>
            <OrderStatusBadge status={status} />
            {order.selfPay && (
              <Badge variant="outline" className="text-[11px] font-medium">
                Self-Pay
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{order.patient}</span>
            <span className="text-border">/</span>
            <span>{order.payer}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(status === "Draft" || status === "Action Required") && (
            <Button size="sm" asChild>
              <Link href={`/orders/new?continue=${encodeURIComponent(order.id)}`}>
                {status === "Draft" ? "Continue order" : "Edit order"}
              </Link>
            </Button>
          )}
          {status === "Needs Approval" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setRejectionDialogOpen(true)}>
                Reject
              </Button>
              <Button size="sm" onClick={handleApprove}>
                Approve Order
              </Button>
            </>
          )}
          {status === "Approved" && (
            <Button size="sm" variant="outline" onClick={handleGenerateDocs}>
              Generate Docs
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="line-items" className="text-xs">Line Items</TabsTrigger>
          <TabsTrigger value="attachments" className="text-xs">Attachments</TabsTrigger>
          {status === "Docs Ready" && (
            <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
          )}
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {status === "Action Required" && rejectedReasonDisplay && (
            <Card className="mb-4 border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-destructive">Rejection reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{rejectedReasonDisplay}</p>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border border-border bg-card shadow-none">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{order.patient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DOB</span>
                  <span className="text-foreground">{order.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground">{order.phone}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-none">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payer</span>
                  <span className="font-medium text-foreground">{order.payer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance ID</span>
                  <span className="font-mono text-foreground">{order.insuranceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Group</span>
                  <span className="text-foreground">{order.groupNumber}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2 border border-border bg-card shadow-none">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-foreground">{order.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City / State / ZIP</span>
                  <span className="text-foreground">
                    {order.city}, {order.state} {order.zip}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="line-items" className="mt-4">
          <Card className="border border-border bg-card shadow-none">
            <CardContent className="px-4">
              {order.lineItems.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No line items</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Product</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">HCPCS</TableHead>
                      <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Qty</TableHead>
                      <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cost</TableHead>
                      <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Allowed</TableHead>
                      <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pt. Share</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Measurement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.lineItems.map((li) => (
                      <TableRow key={li.id}>
                        <TableCell className="text-sm text-foreground">{li.product}</TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{li.hcpcs}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-foreground">{li.qty}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          ${li.cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-foreground">
                          ${li.allowedAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          ${li.patientShare.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {li.hasMeasurement ? (
                            <Badge variant="secondary" className="text-[11px] font-medium">
                              Attached
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not required</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {order.lineItems.length > 0 && (
            <div className="mt-3 flex justify-end gap-6 text-sm">
              <div className="text-muted-foreground">
                Total Allowed:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  ${order.totalAllowed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-muted-foreground">
                Margin:{" "}
                <span className="font-semibold tabular-nums text-foreground">{order.margin}%</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="attachments" className="mt-4">
          <Card className="border border-border bg-card shadow-none">
            <CardContent className="p-5">
              {attachments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No attachments</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{att.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {att.type.includes("pdf") ? "PDF" : "Word"} · {(att.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0" disabled>
                        <Download className="size-3.5" />
                        <span className="sr-only">Download</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {status === "Docs Ready" && (
          <TabsContent value="documents" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.title} className="border border-border bg-card shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="size-4 text-muted-foreground" />
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {doc.description}
                    </p>
                    <Button variant="outline" size="sm" className="h-7 w-fit text-xs" asChild>
                      <Link href={doc.href}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="activity" className="mt-4">
          <Card className="border border-border bg-card shadow-none">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4">
                {notes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{note.author}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(note.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{note.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddNote()
                    }
                  }}
                  className="h-8 bg-background text-sm"
                />
                <Button size="icon" variant="outline" className="size-8 shrink-0" onClick={handleAddNote}>
                  <Send className="size-3.5" />
                  <span className="sr-only">Send note</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The following item(s) require approval. State why you are rejecting this order.
          </p>
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Item(s) requiring approval
            </p>
            <ul className="space-y-1 text-sm text-foreground">
              {itemsRequiringApproval.map((li) => (
                <li key={li.id} className="font-medium">
                  {li.product} ({li.hcpcs}) × {li.qty}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Reason for rejection</Label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this order is being rejected..."
              rows={4}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setRejectionDialogOpen(false); setRejectionReason(""); }}>
              Cancel
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={handleRejectSubmit}>
              Submit rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
