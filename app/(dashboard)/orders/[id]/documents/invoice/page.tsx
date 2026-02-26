"use client"

import { use } from "react"
import { Separator } from "@/components/ui/separator"
import { DocumentShell } from "@/components/document-shell"
import { orders } from "@/lib/mock-data"

export default function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const order = orders.find((o) => o.id.toLowerCase() === id.toLowerCase())

  if (!order) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Order not found</p>
  }

  const totalAllowed = order.lineItems.reduce((sum, li) => sum + li.allowedAmount * li.qty, 0)
  const totalPatientShare = order.lineItems.reduce((sum, li) => sum + li.patientShare * li.qty, 0)
  const insurancePays = totalAllowed - totalPatientShare

  return (
    <DocumentShell orderId={id}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Patient Invoice</h2>
            <p className="mt-1 text-xs text-muted-foreground">MedSupply OS</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-card-foreground">{order.id}</p>
            <p className="text-muted-foreground">{order.updated}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bill To</p>
            <p className="font-medium text-card-foreground">{order.patient}</p>
            <p className="text-muted-foreground">{order.address}</p>
            <p className="text-muted-foreground">{order.city}, {order.state} {order.zip}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Insurance</p>
            <p className="font-medium text-card-foreground">{order.payer}</p>
            <p className="text-muted-foreground">ID: {order.insuranceId}</p>
            <p className="text-muted-foreground">Group: {order.groupNumber}</p>
          </div>
        </div>

        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">HCPCS</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Allowed</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Patient Share</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems.map((li) => (
                <tr key={li.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-card-foreground">{li.product}</td>
                  <td className="px-3 py-2 text-muted-foreground">{li.hcpcs}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-card-foreground">{li.qty}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-card-foreground">
                    ${(li.allowedAmount * li.qty).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-card-foreground">
                    ${(li.patientShare * li.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex w-64 justify-between">
            <span className="text-muted-foreground">Total Allowed</span>
            <span className="tabular-nums text-card-foreground">${totalAllowed.toFixed(2)}</span>
          </div>
          <div className="flex w-64 justify-between">
            <span className="text-muted-foreground">Insurance Pays</span>
            <span className="tabular-nums text-card-foreground">${insurancePays.toFixed(2)}</span>
          </div>
          <Separator className="my-1 w-64" />
          <div className="flex w-64 justify-between font-semibold">
            <span className="text-card-foreground">Patient Responsibility</span>
            <span className="tabular-nums text-card-foreground">${totalPatientShare.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-8 pt-4">
          <div>
            <div className="mb-1 border-b border-border pb-8" />
            <p className="text-xs text-muted-foreground">Patient Signature</p>
          </div>
          <div>
            <div className="mb-1 border-b border-border pb-8" />
            <p className="text-xs text-muted-foreground">Date</p>
          </div>
        </div>
      </div>
    </DocumentShell>
  )
}
