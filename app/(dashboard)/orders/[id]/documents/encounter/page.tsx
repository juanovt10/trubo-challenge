"use client"

import { use } from "react"
import { Separator } from "@/components/ui/separator"
import { DocumentShell } from "@/components/document-shell"
import { orders } from "@/lib/mock-data"

export default function EncounterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const order = orders.find((o) => o.id.toLowerCase() === id.toLowerCase())

  if (!order) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Order not found</p>
  }

  return (
    <DocumentShell orderId={id}>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-card-foreground">Encounter Form</h2>
          <p className="mt-1 text-xs text-muted-foreground">MedSupply OS &ndash; Clinical Documentation</p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Order ID:</span>{" "}
            <span className="font-medium text-card-foreground">{order.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>{" "}
            <span className="text-card-foreground">{order.updated}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Patient:</span>{" "}
            <span className="font-medium text-card-foreground">{order.patient}</span>
          </div>
          <div>
            <span className="text-muted-foreground">DOB:</span>{" "}
            <span className="text-card-foreground">{order.dob}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Payer:</span>{" "}
            <span className="text-card-foreground">{order.payer}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Insurance ID:</span>{" "}
            <span className="text-card-foreground">{order.insuranceId}</span>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">Prescribed Items</h3>
          <div className="rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">HCPCS</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.lineItems.map((li) => (
                  <tr key={li.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-card-foreground">{li.product}</td>
                    <td className="px-3 py-2 text-muted-foreground">{li.hcpcs}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-card-foreground">{li.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">Clinical Notes</h3>
          <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              Face-to-face encounter completed. Patient meets medical necessity criteria for prescribed equipment. Detailed clinical assessment on file.
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-8 pt-4">
          <div>
            <div className="mb-1 border-b border-border pb-8" />
            <p className="text-xs text-muted-foreground">Prescribing Physician Signature</p>
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
