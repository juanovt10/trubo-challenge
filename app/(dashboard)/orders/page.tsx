"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MetricCard } from "@/components/metric-card"
import { OrdersTable } from "@/components/orders-table"
import { orders } from "@/lib/mock-data"

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [payerFilter, setPayerFilter] = useState("all")

  const metrics = useMemo(
    () => ({
      open: orders.filter(
        (o) => o.status === "Draft" || o.status === "Needs Approval"
      ).length,
      needsApproval: orders.filter((o) => o.status === "Needs Approval").length,
      docsReady: orders.filter((o) => o.status === "Docs Ready").length,
    }),
    []
  )

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.patient.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || o.status === statusFilter
      const matchesPayer = payerFilter === "all" || o.payer === payerFilter
      return matchesSearch && matchesStatus && matchesPayer
    })
  }, [search, statusFilter, payerFilter])

  return (
    <div className="flex flex-col gap-6">
      {/* Page title row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Orders</h1>
        <Button asChild size="sm">
          <Link href="/orders/new">
            <Plus className="mr-1.5 size-3.5" />
            Create Order
          </Link>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Open Orders" value={metrics.open} />
        <MetricCard label="Needs Approval" value={metrics.needsApproval} />
        <MetricCard label="Docs Ready" value={metrics.docsReady} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 bg-card pl-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40 bg-card text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Needs Approval">Needs Approval</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Docs Ready">Docs Ready</SelectItem>
          </SelectContent>
        </Select>
        <Select value={payerFilter} onValueChange={setPayerFilter}>
          <SelectTrigger className="h-8 w-32 bg-card text-sm">
            <SelectValue placeholder="Payer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payers</SelectItem>
            <SelectItem value="Medicare">Medicare</SelectItem>
            <SelectItem value="BCBS">BCBS</SelectItem>
            <SelectItem value="Aetna">Aetna</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <OrdersTable orders={filtered} />
    </div>
  )
}
