"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const titleMap: Record<string, string> = {
  "/orders": "Orders",
  "/orders/new": "Create Order",
  "/products": "Products",
  "/fee-schedules": "Fee Schedules",
  "/roadmap": "Roadmap",
}

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  if (pathname.match(/^\/orders\/[^/]+\/documents\/encounter$/))
    return [
      { label: "Orders", href: "/orders" },
      { label: pathname.split("/")[2].toUpperCase(), href: `/orders/${pathname.split("/")[2]}` },
      { label: "Encounter Form" },
    ]
  if (pathname.match(/^\/orders\/[^/]+\/documents\/invoice$/))
    return [
      { label: "Orders", href: "/orders" },
      { label: pathname.split("/")[2].toUpperCase(), href: `/orders/${pathname.split("/")[2]}` },
      { label: "Patient Invoice" },
    ]
  if (pathname.match(/^\/orders\/[^/]+\/documents\/pod$/))
    return [
      { label: "Orders", href: "/orders" },
      { label: pathname.split("/")[2].toUpperCase(), href: `/orders/${pathname.split("/")[2]}` },
      { label: "Proof of Delivery" },
    ]
  if (pathname.match(/^\/orders\/[^/]+$/) && pathname !== "/orders/new") {
    const id = pathname.split("/").pop()?.toUpperCase()
    return [{ label: "Orders", href: "/orders" }, { label: `Order ${id}` }]
  }
  if (titleMap[pathname]) return [{ label: titleMap[pathname] }]
  return [{ label: "Dashboard" }]
}

export function AppHeader() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-card px-6">
      <nav className="flex items-center gap-1.5 text-[13px]" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3 text-muted-foreground/50" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
