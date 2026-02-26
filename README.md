# MedSupply OS

Internal medical supply order management system — a Next.js dashboard for managing orders, products, fee schedules, and document workflows.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **UI:** [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (New York style, neutral theme)
- **Forms & validation:** [React Hook Form](https://react-hook-form.com), [Zod](https://zod.dev), [@hookform/resolvers](https://github.com/react-hook-form/resolvers)
- **Icons:** [Lucide React](https://lucide.dev)
- **Charts:** [Recharts](https://recharts.org)
- **Other:** [date-fns](https://date-fns.org), [Sonner](https://sonner.emilkowal.ski) (toasts), [Vercel Analytics](https://vercel.com/analytics)

## Project Structure

```
├── app/
│   ├── (dashboard)/           # Dashboard layout (sidebar + header)
│   │   ├── fee-schedules/     # Fee schedules table
│   │   ├── orders/            # Orders list, new order, order detail
│   │   │   ├── new/           # Create order
│   │   │   └── [id]/          # Order detail + documents
│   │   │       └── documents/
│   │   │           ├── encounter/
│   │   │           ├── invoice/
│   │   │           └── pod/
│   │   ├── products/          # Products catalog
│   │   └── roadmap/           # Roadmap / sprint view
│   ├── globals.css
│   ├── layout.tsx             # Root layout (metadata, Toaster, Analytics)
│   └── page.tsx               # Home → redirects to /orders
├── components/
│   ├── app-header.tsx         # Top header
│   ├── app-sidebar.tsx        # Collapsible nav (Orders, Products, Fee Schedules, Roadmap)
│   ├── document-shell.tsx     # Document layout wrapper
│   ├── metric-card.tsx        # Dashboard metric cards
│   ├── order-status-badge.tsx # Order status display
│   ├── orders-table.tsx       # Orders list with filters
│   ├── theme-provider.tsx     # Theme provider (if used)
│   └── ui/                    # shadcn/ui components (button, card, table, etc.)
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── mock-data.ts           # Orders, products, fee schedules, roadmap (types + data)
│   └── utils.ts               # cn() and helpers
└── public/                    # Icons, placeholders, assets
```

## Features

- **Orders:** List with search and filters (status, payer), metrics (Open, Needs Approval, Docs Ready), create order, order detail with line items and notes
- **Order documents:** Encounter, Invoice, and POD (Proof of Delivery) document views per order
- **Products:** Catalog table (name, HCPCS, vendor, cost, MSRP, approval/measurement flags)
- **Fee schedules:** Payer/HCPCS allowed amounts and patient share %
- **Roadmap:** Sprint-based roadmap with active sprint highlighting
- **UI:** Collapsible sidebar, responsive layout, toasts, form components

Data is currently driven by **mock data** in `lib/mock-data.ts` (no backend/API).

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) (or npm/yarn)

### Install and run

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/orders`.

### Other scripts

```bash
pnpm build   # Production build
pnpm start   # Start production server
pnpm lint    # Run ESLint
```

## Configuration

- **Next:** `next.config.mjs` — TypeScript build errors ignored, images unoptimized (adjust for production if needed).
- **Tailwind/PostCSS:** `postcss.config.mjs`, `app/globals.css` (Tailwind v4).
- **shadcn:** `components.json` — aliases `@/components`, `@/lib`, `@/hooks`; style `new-york`, base color `neutral`.

## Environment

No environment variables are required for the current mock-data setup. Add a `.env.local` when connecting to an API or database.

## Deploy

You can deploy with [Vercel](https://vercel.com) (recommended for Next.js) or any Node-compatible host. Build command: `pnpm build`; start: `pnpm start`.

---

For more on Next.js, see the [Next.js documentation](https://nextjs.org/docs).
