import { Card, CardContent } from "@/components/ui/card"

interface MetricCardProps {
  label: string
  value: number
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Card className="border border-border bg-card shadow-none">
      <CardContent className="px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums text-card-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
