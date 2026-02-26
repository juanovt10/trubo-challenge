import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/lib/mock-data"
import { Circle, AlertCircle, CheckCircle2, FileCheck2 } from "lucide-react"

const statusConfig: Record<OrderStatus, { icon: typeof Circle; variant: "secondary" | "outline" }> = {
  Draft: { icon: Circle, variant: "secondary" },
  "Needs Approval": { icon: AlertCircle, variant: "outline" },
  Approved: { icon: CheckCircle2, variant: "secondary" },
  "Docs Ready": { icon: FileCheck2, variant: "secondary" },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className="gap-1 text-[11px] font-medium"
    >
      <Icon className="size-3" />
      {status}
    </Badge>
  )
}
