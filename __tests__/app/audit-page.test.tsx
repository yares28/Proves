import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import AuditPage from "@/app/audit/page"
import type { AuditReport, AuditResult } from "@/actions/audit"

let mockAuthValue: { user: any; loading: boolean } = { user: null, loading: false }
jest.mock("@/context/auth-context", () => ({
  useAuth: () => mockAuthValue,
}))

jest.mock("@/utils/auth-helpers", () => ({
  getFreshAuthTokens: jest.fn().mockResolvedValue({ accessToken: "a", refreshToken: "r" }),
}))

const mockGetAuditReport = jest.fn()
jest.mock("@/actions/audit", () => ({
  getAuditReport: (...args: any[]) => mockGetAuditReport(...args),
}))

const sampleReport: AuditReport = {
  generatedAt: "2026-07-19T10:00:00.000Z",
  environment: {
    appVersion: "0.1.0",
    nextVersion: "15.5.20",
    nodeEnv: "test",
    siteUrl: "https://upv-cal.vercel.app",
    supabaseProject: "pzmmphrbkrmyyzjoitau.supabase.co",
  },
  overview: {
    totalExams: 1479,
    liveExams: 1470,
    deletedExams: 9,
    academicYears: [2025],
    currentAcademicYear: 2025,
    schools: 2,
    degrees: 12,
    subjects: 640,
    userCalendars: 1,
    calendarTokens: 1,
    expiredTokens: 0,
    lastSync: { at: "2026-07-18T04:00:00.000Z", status: "success", trigger: "cron-daily" },
  },
  years: [
    {
      year: 2025,
      label: "2025-2026",
      live: 1470,
      deleted: 9,
      schools: 2,
      degrees: 12,
      subjects: 640,
      minDate: "2025-09-01",
      maxDate: "2026-07-15",
    },
  ],
  checks: [
    {
      id: "blank_acronym",
      label: "Blank acronym",
      description: "Live exams with no acronym.",
      severity: "warn",
      count: 3,
      sample: ["Foo · 2026-01-10"],
    },
    {
      id: "missing_time",
      label: "Missing exam time",
      description: "Live exams with no start time.",
      severity: "info",
      count: 12,
    },
    {
      id: "blank_subject",
      label: "Blank subject",
      description: "Live exams whose subject name is empty.",
      severity: "ok",
      count: 0,
    },
  ],
  syncRuns: [
    {
      id: "run-1",
      startedAt: "2026-07-18T04:00:00.000Z",
      finishedAt: "2026-07-18T04:00:12.000Z",
      trigger: "cron-daily",
      yearLabel: "2025-2026",
      status: "success",
      fetched: 1479,
      inserted: 4,
      updated: 10,
      deleted: 1,
      restored: 0,
      quarantined: 0,
      durationMs: 12000,
      error: null,
    },
  ],
  snapshots: [{ id: "snap-1", capturedAt: "2026-07-18T04:00:00.000Z", academicYear: 2025, rowCount: 1479 }],
  notes: [],
}

const ok = (report: AuditReport): AuditResult => ({ ok: true, report })

describe("AuditPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthValue = { user: null, loading: false }
  })

  it("denies access when there is no signed-in user", async () => {
    mockAuthValue = { user: null, loading: false }
    render(<AuditPage />)

    expect(await screen.findByText("Access denied")).toBeInTheDocument()
    expect(mockGetAuditReport).not.toHaveBeenCalled()
  })

  it("shows the not-configured state", async () => {
    mockAuthValue = { user: { email: "owner@example.com" }, loading: false }
    mockGetAuditReport.mockResolvedValue({ ok: false, reason: "not_configured" })
    render(<AuditPage />)

    expect(await screen.findByText("Audit not configured")).toBeInTheDocument()
  })

  it("shows access denied when the server rejects a non-admin", async () => {
    mockAuthValue = { user: { email: "someone@example.com" }, loading: false }
    mockGetAuditReport.mockResolvedValue({ ok: false, reason: "unauthorized" })
    render(<AuditPage />)

    expect(await screen.findByText("Access denied")).toBeInTheDocument()
  })

  it("renders the full report for an authorized admin", async () => {
    mockAuthValue = { user: { email: "owner@example.com" }, loading: false }
    mockGetAuditReport.mockResolvedValue(ok(sampleReport))
    render(<AuditPage />)

    // Header + overview
    expect(await screen.findByText("Data Audit")).toBeInTheDocument()
    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getAllByText("1,479").length).toBeGreaterThan(0) // total exams / snapshot rows

    // Integrity checks
    expect(screen.getByText("Integrity checks")).toBeInTheDocument()
    expect(screen.getByText("Blank acronym")).toBeInTheDocument()

    // Versions + differentiation + snapshots + environment
    expect(screen.getByText("Versions — academic years")).toBeInTheDocument()
    expect(screen.getAllByText("2025-2026").length).toBeGreaterThan(0)
    expect(screen.getByText("Differentiation — sync history")).toBeInTheDocument()
    expect(screen.getByText("Raw snapshots")).toBeInTheDocument()
    expect(screen.getByText("Environment")).toBeInTheDocument()
    expect(screen.getByText("15.5.20")).toBeInTheDocument() // next version

    expect(mockGetAuditReport).toHaveBeenCalledWith({ accessToken: "a", refreshToken: "r" })
  })

  it("shows an error state the report fails to load", async () => {
    mockAuthValue = { user: { email: "owner@example.com" }, loading: false }
    mockGetAuditReport.mockResolvedValue({ ok: false, reason: "error", message: "boom" })
    render(<AuditPage />)

    expect(await screen.findByText("Could not load audit")).toBeInTheDocument()
    expect(screen.getByText("boom")).toBeInTheDocument()
  })
})
