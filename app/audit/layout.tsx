import type { Metadata } from "next"
import { Header } from "@/components/header"

export const metadata: Metadata = {
  title: "Audit",
  // Private owner tooling: never index or follow.
  robots: { index: false, follow: false, nocache: true },
}

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
