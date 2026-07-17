/**
 * HTTP client for the ETSINF exams API.
 *
 * The upstream is fragile — during development it returned JSON 500 envelopes
 * ("Unable to acquire JDBC Connection") and hung sockets — so every failure mode
 * is classified as retryable (transient) or fatal (our bug / contract change).
 */
import { API_BASE, HTTP, USER_AGENT } from './config.js';
import { log } from './log.js';
import {
  examsEnvelopeSchema,
  errorEnvelopeSchema,
  titulacionesSchema,
  type ExamsEnvelope,
} from './schema.js';

export class FatalApiError extends Error {}
export class RetryableApiError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Reads the body with a hard size cap so a runaway response can't exhaust memory. */
async function readCapped(res: Response): Promise<string> {
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > HTTP.maxBodyBytes) {
    throw new FatalApiError(
      `Response too large: content-length ${declared} > ${HTTP.maxBodyBytes}`
    );
  }
  const text = await res.text();
  if (text.length > HTTP.maxBodyBytes) {
    throw new FatalApiError(`Response too large: ${text.length} bytes`);
  }
  return text;
}

/** One attempt. Throws FatalApiError (don't retry) or RetryableApiError (do). */
async function attempt(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP.timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'manual',
    });
  } catch (err) {
    // Timeout, DNS, TLS, connection reset — all transient in practice.
    throw new RetryableApiError(
      `Network failure for ${url}: ${(err as Error).message}`
    );
  } finally {
    clearTimeout(timer);
  }

  // A redirect means the API moved (or an SSO wall appeared): our config is wrong.
  if (res.status >= 300 && res.status < 400) {
    throw new FatalApiError(
      `Unexpected redirect (${res.status}) to "${res.headers.get('location')}" for ${url}. The API may have moved or now requires auth.`
    );
  }

  // 4xx is our fault (bad year parameter, wrong path) — retrying won't help.
  if (res.status >= 400 && res.status < 500) {
    throw new FatalApiError(
      `Client error ${res.status} for ${url}. Check the requested year/endpoint.`
    );
  }

  if (res.status >= 500) {
    throw new RetryableApiError(`Server error ${res.status} for ${url}`);
  }

  const body = await readCapped(res);
  const ctype = res.headers.get('content-type') || '';

  if (!ctype.includes('json')) {
    // Typically an HTML maintenance/error page in front of the API.
    const snippet = body.slice(0, 120).replace(/\s+/g, ' ');
    throw new RetryableApiError(
      `Expected JSON from ${url} but got content-type "${ctype}". Body starts: ${snippet}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new RetryableApiError(
      `Malformed/truncated JSON from ${url} (${body.length} bytes)`
    );
  }

  // Upstream signals failure with a 200-ish JSON error envelope in some cases.
  const asError = errorEnvelopeSchema.safeParse(parsed);
  if (asError.success && !(parsed as Record<string, unknown>).data) {
    throw new RetryableApiError(`Upstream error envelope: ${asError.data.message}`);
  }

  return parsed;
}

async function fetchJson(url: string): Promise<unknown> {
  let lastError: Error | undefined;

  for (let i = 0; i <= HTTP.retryDelaysMs.length; i++) {
    try {
      return await attempt(url);
    } catch (err) {
      if (err instanceof FatalApiError) throw err;
      lastError = err as Error;

      const delay = HTTP.retryDelaysMs[i];
      if (delay === undefined) break; // out of retries
      log.info('fetch', `Attempt ${i + 1} failed, retrying in ${delay / 1000}s`, {
        url,
        error: lastError.message,
      });
      await sleep(delay);
    }
  }

  throw new Error(
    `Giving up on ${url} after ${HTTP.retryDelaysMs.length + 1} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Fetches exams for an academic start year. `year = 0` asks the API for whatever
 * it considers the current year (the site's own default).
 */
export async function fetchExams(year: number): Promise<ExamsEnvelope> {
  const url = `${API_BASE}/examenesfc/${year}`;
  log.info('fetch', 'Requesting exams', { url });

  const raw = await fetchJson(url);
  const parsed = examsEnvelopeSchema.safeParse(raw);

  if (!parsed.success) {
    // This is the layout-change signal: name the offending paths precisely.
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join(' | ');
    throw new FatalApiError(
      `Exam payload does not match the expected contract — the upstream layout may have changed. Issues: ${issues}`
    );
  }

  log.info('fetch', 'Received exams', {
    year: parsed.data.data.cursoAcademico,
    rows: parsed.data.data.examenes.length,
  });
  return parsed.data;
}

export async function fetchTitulaciones() {
  const url = `${API_BASE}/titulaciones`;
  const raw = await fetchJson(url);
  const parsed = titulacionesSchema.safeParse(raw);
  if (!parsed.success) {
    throw new FatalApiError(
      `Titulaciones payload does not match the expected contract: ${parsed.error.issues[0]?.message}`
    );
  }
  return parsed.data;
}

export const politeGap = () => sleep(HTTP.spacingMs);
