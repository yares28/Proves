/**
 * Structured logging. One JSON object per line so GitHub Actions logs stay
 * greppable and machine-readable, plus an in-memory warning buffer that ends up
 * in sync_runs.warnings.
 */

type Level = 'info' | 'warn' | 'error';

export interface Warning {
  code: string;
  message: string;
  sample?: unknown;
  count?: number;
}

const warnings: Warning[] = [];
/** Warnings are aggregated by code so one bad pattern can't spam thousands of lines. */
const warnCounts = new Map<string, Warning>();

function emit(level: Level, step: string, message: string, data?: object) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    step,
    message,
    ...(data ?? {}),
  });
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const log = {
  info: (step: string, message: string, data?: object) => emit('info', step, message, data),

  error: (step: string, message: string, data?: object) => emit('error', step, message, data),

  /**
   * Records a warning: logged once per code with a running count, and collected
   * for the sync_runs row.
   */
  warn: (code: string, message: string, sample?: unknown) => {
    const existing = warnCounts.get(code);
    if (existing) {
      existing.count = (existing.count ?? 1) + 1;
      return;
    }
    const w: Warning = { code, message, sample, count: 1 };
    warnCounts.set(code, w);
    warnings.push(w);
    emit('warn', code, message, sample !== undefined ? { sample } : undefined);
  },

  /** Warnings collected so far, with final counts. */
  collected: (): Warning[] => warnings.map((w) => ({ ...w })),

  reset: () => {
    warnings.length = 0;
    warnCounts.clear();
  },
};
