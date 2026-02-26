"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClipboardList,
  Package,
  DollarSign,
  Map,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { label: "Orders", href: "/orders", icon: ClipboardList },
  { label: "Products", href: "/products", icon: Package },
  { label: "Fee Schedules", href: "/fee-schedules", icon: DollarSign },
  { label: "Roadmap", href: "/roadmap", icon: Map },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
          collapsed ? "w-[52px]" : "w-[220px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-3">
          {!collapsed && (
            <span className="text-[13px] font-semibold tracking-tight text-sidebar-foreground">
              MedSupply OS
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-7 text-muted-foreground hover:text-sidebar-foreground",
              collapsed && "mx-auto"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronsRight className="size-3.5" />
            ) : (
              <ChevronsLeft className="size-3.5" />
            )}
            <span className="sr-only">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-3 py-2.5">
          {!collapsed && (
            <p className="text-[11px] text-muted-foreground">Sprint 1 Prototype</p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
