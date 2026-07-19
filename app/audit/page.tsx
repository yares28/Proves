"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getFreshAuthTokens } from "@/utils/auth-helpers"
import { getAuditReport, type AuditReport, type AuditResult, type Severity } from "@/actions/audit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react"

type Screen =
  | { kind: "loading" }
  | { kind: "denied" }
  | { kind: "not_configured" }
  | { kind: "error"; message?: string }
  | { kind: "report"; report: AuditReport }

const SEVERITY_STYLES: Record<Severity, { label: string; badge: string; icon: React.ReactNode }> = {
  fail: {
    label: "Fail",
    badge: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300/50",
    icon: <XCircle className="h-4 w-4" />,
  },
  warn: {
    label: "Warn",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300/50",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  info: {
    label: "Info",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300/50",
    icon: <Info className="h-4 w-4" />,
  },
  ok: {
    label: "OK",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/50",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function StatTile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

function SeverityPill({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLES[severity]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s.badge}`}
    >
      {s.icon}
      {s.label}
    </span>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function CenteredCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          {icon}
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="text-sm text-muted-foreground">{children}</div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth()
  const [screen, setScreen] = useState<Screen>({ kind: "loading" })
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const tokens = await getFreshAuthTokens()
      const result: AuditResult = await getAuditReport({
        accessToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken,
      })
      if (result.ok) setScreen({ kind: "report", report: result.report })
      else if (result.reason === "not_configured") setScreen({ kind: "not_configured" })
      else if (result.reason === "unauthorized") setScreen({ kind: "denied" })
      else setScreen({ kind: "error", message: result.message })
    } catch (e) {
      setScreen({ kind: "error", message: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setScreen({ kind: "denied" })
      return
    }
    load()
  }, [authLoading, user, load])

  if (authLoading || screen.kind === "loading") {
    return (
      <CenteredCard icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />} title="Loading audit…">
        Verifying your session and gathering data.
      </CenteredCard>
    )
  }

  if (screen.kind === "denied") {
    return (
      <CenteredCard icon={<Lock className="h-8 w-8 text-muted-foreground" />} title="Access denied">
        This page is private to the site owner. Sign in with an authorized account to view it.
      </CenteredCard>
    )
  }

  if (screen.kind === "not_configured") {
    return (
      <CenteredCard icon={<ShieldAlert className="h-8 w-8 text-amber-500" />} title="Audit not configured">
        Set the <code className="rounded bg-muted px-1">ADMIN_EMAILS</code> environment variable (a
        comma-separated allowlist) to enable this page.
      </CenteredCard>
    )
  }

  if (screen.kind === "error") {
    return (
      <CenteredCard icon={<XCircle className="h-8 w-8 text-red-500" />} title="Could not load audit">
        <p>{screen.message ?? "Something went wrong."}</p>
        <Button className="mt-4" onClick={load} disabled={refreshing}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </CenteredCard>
    )
  }

  const { report } = screen
  const { overview, environment } = report
  const counts = report.checks.reduce(
    (acc, c) => ({ ...acc, [c.severity]: (acc[c.severity] ?? 0) + 1 }),
    {} as Record<Severity, number>,
  )

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Private · owner only
          </div>
          <h1 className="mt-1 text-3xl font-bold">Data Audit</h1>
          <p className="text-sm text-muted-foreground">Generated {fmtDateTime(report.generatedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            {(["fail", "warn", "info", "ok"] as Severity[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <SeverityPill severity={s} />
                <span className="tabular-nums text-muted-foreground">{counts[s] ?? 0}</span>
              </span>
            ))}
          </div>
          <Button onClick={load} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        {/* Overview */}
        <Section title="Overview" description="Current state of the exam dataset.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatTile label="Total exams" value={overview.totalExams.toLocaleString()} />
            <StatTile label="Live" value={overview.liveExams.toLocaleString()} hint="visible in app" />
            <StatTile
              label="Soft-deleted"
              value={overview.deletedExams.toLocaleString()}
              hint="hidden, kept for history"
            />
            <StatTile
              label="Academic years"
              value={overview.academicYears.length}
              hint={overview.academicYears.map((y) => `${y}-${y + 1}`).join(", ") || "—"}
            />
            <StatTile label="Schools" value={overview.schools} />
            <StatTile label="Degrees" value={overview.degrees} />
            <StatTile label="Subjects" value={overview.subjects.toLocaleString()} />
            <StatTile
              label="Last sync"
              value={
                overview.lastSync ? (
                  <span className="text-base">{fmtDateTime(overview.lastSync.at)}</span>
                ) : (
                  "—"
                )
              }
              hint={
                overview.lastSync
                  ? `${overview.lastSync.status ?? "?"} · ${overview.lastSync.trigger ?? "?"}`
                  : "no sync on record"
              }
            />
          </div>
        </Section>

        {/* Integrity checks */}
        <Section
          title="Integrity checks"
          description="Automated correctness and completeness checks over live exam rows."
        >
          <div className="grid gap-3">
            {report.checks.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityPill severity={c.severity} />
                    <span className="font-medium">{c.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                  {c.sample && c.sample.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.sample.map((s, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-semibold tabular-nums">{c.count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">rows</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Versions: academic years */}
        <Section
          title="Versions — academic years"
          description="Each academic year is a distinct version of the dataset."
        >
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Course</th>
                  <th className="px-4 py-2 text-right font-medium">Live</th>
                  <th className="px-4 py-2 text-right font-medium">Deleted</th>
                  <th className="px-4 py-2 text-right font-medium">Schools</th>
                  <th className="px-4 py-2 text-right font-medium">Degrees</th>
                  <th className="px-4 py-2 text-right font-medium">Subjects</th>
                  <th className="px-4 py-2 font-medium">Date range</th>
                </tr>
              </thead>
              <tbody>
                {report.years.map((y) => (
                  <tr key={y.year} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {y.label}
                      {y.year === overview.currentAcademicYear && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          current
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{y.live.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{y.deleted.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{y.schools}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{y.degrees}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{y.subjects.toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {y.minDate ?? "—"} → {y.maxDate ?? "—"}
                    </td>
                  </tr>
                ))}
                {report.years.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                      No exam data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Differentiation: sync history */}
        <Section
          title="Differentiation — sync history"
          description="Each scraper run and the diff it applied to the dataset."
        >
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Trigger</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Fetched</th>
                  <th className="px-4 py-2 text-right font-medium text-emerald-600">+Ins</th>
                  <th className="px-4 py-2 text-right font-medium text-sky-600">~Upd</th>
                  <th className="px-4 py-2 text-right font-medium text-red-600">−Del</th>
                  <th className="px-4 py-2 text-right font-medium">Restored</th>
                  <th className="px-4 py-2 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {report.syncRuns.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">{fmtDateTime(r.startedAt)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.trigger ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          r.status === "success"
                            ? "text-emerald-600"
                            : r.status === "failed"
                              ? "text-red-600"
                              : "text-muted-foreground"
                        }
                      >
                        {r.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.fetched}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-600">{r.inserted}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-sky-600">{r.updated}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-red-600">{r.deleted}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.restored}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {fmtDuration(r.durationMs)}
                    </td>
                  </tr>
                ))}
                {report.syncRuns.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">
                      No sync runs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Snapshots */}
        <Section
          title="Raw snapshots"
          description="Upstream payloads captured per run, so any past version can be re-applied or compared."
        >
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Captured</th>
                  <th className="px-4 py-2 font-medium">Course</th>
                  <th className="px-4 py-2 text-right font-medium">Rows</th>
                </tr>
              </thead>
              <tbody>
                {report.snapshots.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">{fmtDateTime(s.capturedAt)}</td>
                    <td className="px-4 py-2">
                      {s.academicYear ? `${s.academicYear}-${s.academicYear + 1}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{s.rowCount.toLocaleString()}</td>
                  </tr>
                ))}
                {report.snapshots.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      No snapshots recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Environment + user data */}
        <Section title="Environment" description="Runtime and deployment details.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile label="App version" value={<span className="text-base">{environment.appVersion}</span>} />
            <StatTile label="Next.js" value={<span className="text-base">{environment.nextVersion}</span>} />
            <StatTile label="Node env" value={<span className="text-base">{environment.nodeEnv}</span>} />
            <StatTile
              label="Supabase project"
              value={<span className="break-all text-sm">{environment.supabaseProject}</span>}
            />
            <StatTile label="User calendars" value={overview.userCalendars ?? "—"} />
            <StatTile
              label="Calendar tokens"
              value={overview.calendarTokens ?? "—"}
              hint={overview.expiredTokens != null ? `${overview.expiredTokens} expired` : undefined}
            />
          </div>
        </Section>

        {report.notes.length > 0 && (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">Notes</div>
            <ul className="list-inside list-disc space-y-1">
              {report.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
