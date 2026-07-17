import type { Exam } from '@/types/exam'

/**
 * Finds exams a student cannot realistically sit through cleanly: two exams at
 * the same time, two back-to-back with no time to get between rooms, or three
 * or more crowded into a single day. Nobody else in this space surfaces this —
 * it only becomes possible once a student has selected their actual subjects,
 * which is exactly the filter this reads.
 */

/** Two exams within this many minutes of each other (no overlap) still count as too tight to be safe. */
const TIGHT_GAP_MINUTES = 60

/** duration_minutes at or above this is a multi-day item (see toDurationDay in the scraper), not a sit-down exam. */
const MULTI_DAY_THRESHOLD_MINUTES = 24 * 60

export type ConflictSeverity = 'overlap' | 'tight' | 'busy'

export interface ConflictPair {
  a: Exam
  b: Exam
  /** Minutes the two time windows genuinely overlap by. 0 if they don't. */
  overlapMinutes: number
  /** Minutes between one exam ending and the next starting. Null if they overlap. */
  gapMinutes: number | null
}

export interface DayConflict {
  date: string
  /** overlap: two exams at once. tight: back-to-back with under an hour. busy: 3+ exams, otherwise fine. */
  severity: ConflictSeverity
  /** Every exam on this date, for display — not just the ones in a flagged pair. */
  exams: Exam[]
  /** The specific pairs that are overlapping or tight, worst first. Empty for 'busy'. */
  pairs: ConflictPair[]
}

interface TimedInterval {
  exam: Exam
  start: number // minutes after midnight
  end: number
}

/**
 * The exam's time window, or null if it can't anchor one: no clock time (an
 * all-day / take-home item), or duration_minutes spans a full day or more (a
 * multi-day project, not a sitting anyone could be double-booked against).
 */
function timedInterval(exam: Exam): TimedInterval | null {
  if (!exam.time || !/^\d{1,2}:\d{2}/.test(exam.time)) return null
  if (exam.duration_minutes >= MULTI_DAY_THRESHOLD_MINUTES) return null

  const [hours, minutes] = exam.time.slice(0, 5).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null

  const start = hours * 60 + minutes
  const duration = exam.duration_minutes > 0 ? exam.duration_minutes : 120
  return { exam, start, end: start + duration }
}

/**
 * Identifies the course, not the row. Upstream represents one exam split
 * across several rooms as several identical-looking rows (same subject, same
 * acronym, same time) — real data, not a bug (scraper/sql confirms this: e.g.
 * "Teoría de autómatas" on 2025-12-22 is 5 rows, one per lab, all at 08:00).
 * A student sits in exactly one room, so these must never be treated as a
 * clash with each other. Acronym is not globally unique (it is scoped to a
 * degree — "BDA" is a different course in GCD than in GIINF), so identity is
 * acronym *and* subject name together.
 */
function courseKey(exam: Exam): string {
  const acronym = (exam.acronym || '').trim().toLowerCase()
  const subject = exam.subject.trim().toLowerCase()
  return acronym ? `${acronym}|${subject}` : subject
}

function classifyPair(a: TimedInterval, b: TimedInterval): ConflictPair | null {
  if (courseKey(a.exam) === courseKey(b.exam)) return null

  const overlapMinutes = Math.min(a.end, b.end) - Math.max(a.start, b.start)
  if (overlapMinutes > 0) {
    return { a: a.exam, b: b.exam, overlapMinutes, gapMinutes: null }
  }

  const gapMinutes = a.start <= b.start ? b.start - a.end : a.start - b.end
  if (gapMinutes < TIGHT_GAP_MINUTES) {
    return { a: a.exam, b: b.exam, overlapMinutes: 0, gapMinutes }
  }

  return null
}

/** Worse of two pairs describing the same course combination: more overlap wins, then a smaller gap. */
function worsePair(existing: ConflictPair, candidate: ConflictPair): ConflictPair {
  if (candidate.overlapMinutes !== existing.overlapMinutes) {
    return candidate.overlapMinutes > existing.overlapMinutes ? candidate : existing
  }
  return (candidate.gapMinutes ?? Infinity) < (existing.gapMinutes ?? Infinity) ? candidate : existing
}

/**
 * Groups a selection of exams by date and flags days worth a warning.
 * Two exams sharing a day with a comfortable gap are not flagged at all —
 * that's just an ordinary week, not a conflict.
 */
export function detectConflicts(exams: Exam[]): DayConflict[] {
  const byDate = new Map<string, Exam[]>()
  for (const exam of exams) {
    if (!exam.date) continue
    const list = byDate.get(exam.date)
    if (list) list.push(exam)
    else byDate.set(exam.date, [exam])
  }

  const conflicts: DayConflict[] = []

  for (const [date, dayExams] of byDate) {
    if (dayExams.length < 2) continue

    // The course count, not the row count, is what "how many things are on this
    // day" means to a student — otherwise a single multi-room exam alone would
    // misreport itself as a busy day.
    const distinctCourses = new Set(dayExams.map(courseKey)).size
    if (distinctCourses < 2) continue

    const intervals = dayExams
      .map(timedInterval)
      .filter((i): i is TimedInterval => i !== null)
      .sort((a, b) => a.start - b.start)

    // Keyed by the unordered pair of courses, so N duplicate rooms on each side
    // of a real clash report as one pair, not N².
    const pairsByCourses = new Map<string, ConflictPair>()
    for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
        const pair = classifyPair(intervals[i]!, intervals[j]!)
        if (!pair) continue
        const key = [courseKey(pair.a), courseKey(pair.b)].sort().join('~')
        const existing = pairsByCourses.get(key)
        pairsByCourses.set(key, existing ? worsePair(existing, pair) : pair)
      }
    }
    const pairs = [...pairsByCourses.values()].sort((p, q) => q.overlapMinutes - p.overlapMinutes)

    const hasOverlap = pairs.some((p) => p.overlapMinutes > 0)
    const hasTight = pairs.some((p) => p.overlapMinutes === 0)

    let severity: ConflictSeverity
    if (hasOverlap) severity = 'overlap'
    else if (hasTight) severity = 'tight'
    else if (distinctCourses >= 3) severity = 'busy'
    else continue // exactly 2 different courses, comfortable gap: not a conflict

    conflicts.push({ date, severity, exams: dayExams, pairs })
  }

  return conflicts.sort((a, b) => a.date.localeCompare(b.date))
}

const SEVERITY_RANK: Record<ConflictSeverity, number> = { overlap: 2, tight: 1, busy: 0 }

/** The most severe conflict in a list, for a one-line summary badge. */
export function worstSeverity(conflicts: DayConflict[]): ConflictSeverity | null {
  if (!conflicts.length) return null
  return conflicts.reduce(
    (worst, c) => (SEVERITY_RANK[c.severity] > SEVERITY_RANK[worst] ? c.severity : worst),
    conflicts[0]!.severity
  )
}
