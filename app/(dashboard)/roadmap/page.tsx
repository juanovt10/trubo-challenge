import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { roadmapItems } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function RoadmapPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Roadmap</h1>
      <div className="flex flex-col gap-3">
        {roadmapItems.map((item, index) => (
          <div key={item.sprint} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  item.active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {item.sprint}
              </div>
              {index < roadmapItems.length - 1 && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>

            {/* Card */}
            <Card
              className={cn(
                "mb-3 flex-1 border border-border bg-card shadow-none",
                item.active && "ring-1 ring-border"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-sm font-medium text-foreground">
                    Sprint {item.sprint} &ndash; {item.title}
                  </CardTitle>
                  {item.active && (
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1.5">
                  {item.items.map((task) => (
                    <li key={task} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={cn(
                          "mt-[7px] block size-1 shrink-0 rounded-full",
                          item.active ? "bg-foreground" : "bg-muted-foreground/40"
                        )}
                      />
                      <span
                        className={cn(
                          "leading-relaxed",
                          item.active ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
