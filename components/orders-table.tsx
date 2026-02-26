"use client"

import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrderStatusBadge } from "@/components/order-status-badge"
import type { Order } from "@/lib/mock-data"

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter()

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Order ID
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Patient
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Payer
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Allowed
            </TableHead>
            <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Margin
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => router.push(`/orders/${order.id.toLowerCase()}`)}
              >
                <TableCell className="text-sm font-medium text-foreground">
                  {order.id}
                </TableCell>
                <TableCell className="text-sm text-foreground">{order.patient}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.payer}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-foreground">
                  {order.totalAllowed > 0
                    ? `$${order.totalAllowed.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : "\u2014"}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {order.margin > 0 ? `${order.margin}%` : "\u2014"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.updated}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
