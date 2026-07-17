/**
 * CLI entrypoint.
 *
 *   npm run sync -- --dry-run                 # current year, no writes
 *   npm run sync -- --year 2025               # a specific academic year
 *   npm run sync -- --year 2026 --table-override sync_test_26-27
 *   npm run sync -- --force                   # allow a large deletion batch
 *   npm run sync -- --no-probe                # skip the next-year check
 *
 * Exit codes: 0 success/dry-run, 1 failure, 2 aborted by a safety gate.
 */
import { loadEnv, yearLabel } from './config.js';
import { log } from './log.js';
import { AbortRun, makeClient, recordRun, runSync, type SyncOptions } from './sync.js';
import { fetchExams, politeGap } from './api.js';

interface Args {
  year: number | 'current';
  dryRun: boolean;
  force: boolean;
  probe: boolean;
  pruneLegacy: boolean;
  tableOverride?: string;
  trigger: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    year: 'current',
    dryRun: false,
    force: false,
    probe: true,
    pruneLegacy: false,
    trigger: process.env.SYNC_TRIGGER || 'local',
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--year': {
        const v = argv[++i];
        if (!v) throw new Error('--year requires a value (e.g. --year 2025 or --year current)');
        if (v === 'current') args.year = 'current';
        else {
          const n = Number(v);
          if (!Number.isInteger(n) || n < 2000 || n > 2100) {
            throw new Error(`--year must be an academic start year between 2000 and 2100, got "${v}"`);
          }
          args.year = n;
        }
        break;
      }
      case '--table-override': {
        const v = argv[++i];
        if (!v) throw new Error('--table-override requires a table name');
        args.tableOverride = v;
        break;
      }
      case '--dry-run': args.dryRun = true; break;
      case '--force': args.force = true; break;
      case '--no-probe': args.probe = false; break;
      case '--prune-legacy': args.pruneLegacy = true; break;
      case '--help':
      case '-h':
        console.log(
          'Usage: npm run sync -- [--year N|current] [--dry-run] [--force] [--no-probe] [--prune-legacy] [--table-override NAME]'
        );
        process.exit(0);
      // eslint-disable-next-line no-fallthrough
      default:
        if (a?.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    }
  }
  return args;
}

/**
 * Checks whether the next academic year has been published yet, and imports it
 * if so. Around September UPV starts filling it in.
 *
 * Since every year lives in the one `exams` table, this needs no DDL and no
 * deploy: the rows simply appear, and the site serves them the moment the
 * calendar rolls over into September.
 */
async function probeNextYear(env: ReturnType<typeof loadEnv>, currentYear: number, dryRun: boolean) {
  const next = currentYear + 1;
  await politeGap();

  const envelope = await fetchExams(next);
  const count = envelope.data.examenes.length;

  if (count === 0) {
    log.info('probe', `Next year ${yearLabel(next)} has no exams published yet; nothing to do`);
    return;
  }

  log.info('probe', `Next year ${yearLabel(next)} has ${count} exams published`);

  if (dryRun) {
    log.info('probe', 'Dry run: not syncing the next year');
    return;
  }

  await politeGap();
  await runSync({ env, year: next, dryRun: false, force: false, trigger: `${process.env.SYNC_TRIGGER || 'local'}-probe` });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnv();
  const startedAt = Date.now();

  const opts: SyncOptions = {
    env,
    year: args.year,
    dryRun: args.dryRun,
    tableOverride: args.tableOverride,
    force: args.force,
    trigger: args.trigger,
    pruneLegacy: args.pruneLegacy,
  };

  try {
    const { counters, status } = await runSync(opts);
    log.info('done', `Sync ${status}`, counters);

    // Only probe when syncing the live current year into its real table.
    if (args.probe && args.year === 'current' && !args.tableOverride) {
      const current = new Date().getUTCFullYear();
      try {
        // The sync already told us the real academic year via its table name;
        // recompute defensively from the API instead of guessing from the clock.
        const envelope = await fetchExams(0);
        await probeNextYear(env, envelope.data.cursoAcademico, args.dryRun);
      } catch (err) {
        log.warn('probe_failed', `Next-year probe failed (current year sync was fine): ${(err as Error).message}`, {
          hint: `clock year ${current}`,
        });
      }
    }
    process.exit(0);
  } catch (err) {
    const message = (err as Error).message;
    const aborted = err instanceof AbortRun;

    log.error(aborted ? 'abort' : 'fail', message);

    // Record the failure so the outage is visible in sync_runs, not just in CI logs.
    try {
      await recordRun(makeClient(env), opts, {
        academicYear: typeof args.year === 'number' ? args.year : null,
        label: typeof args.year === 'number' ? yearLabel(args.year) : null,
        table: args.tableOverride ?? null,
        counters: {},
        status: aborted ? 'aborted' : 'failed',
        startedAt,
        error: message,
      });
    } catch (auditErr) {
      log.error('audit', `Could not record the failed run: ${(auditErr as Error).message}`);
    }

    process.exit(aborted ? 2 : 1);
  }
}

main();
