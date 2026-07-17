/**
 * Exercises the HTTP failure taxonomy against a local server, covering the modes
 * actually observed upstream (JSON 500 envelope, hung socket) plus the ones we
 * must never retry (4xx, redirects).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { baseRow, envelope, errorEnvelope } from './fixtures.js';

// Must be set before the modules read them at import time.
process.env.SCRAPER_RETRY_DELAYS_MS = '5,5,5';
process.env.SCRAPER_TIMEOUT_MS = '300';

let server: Server;
let api: typeof import('../src/api.js');

/** Per-test behaviour of the fake upstream. */
let handler: (url: string, res: import('node:http').ServerResponse) => void;

before(async () => {
  server = createServer((req, res) => handler(req.url ?? '', res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  process.env.SCRAPER_API_BASE = `http://127.0.0.1:${port}/api/v1/horarios`;
  api = await import('../src/api.js');
});

after(() => new Promise<void>((resolve) => server.close(() => resolve())));

const json = (res: import('node:http').ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

test('parses a healthy payload', async () => {
  handler = (_u, res) => json(res, 200, envelope([baseRow]));
  const out = await api.fetchExams(2025);
  assert.equal(out.data.cursoAcademico, 2025);
  assert.equal(out.data.examenes.length, 1);
});

test('retries a 500 and succeeds when the upstream recovers', async () => {
  let calls = 0;
  handler = (_u, res) => {
    calls++;
    if (calls < 3) return json(res, 500, errorEnvelope);
    json(res, 200, envelope([baseRow]));
  };
  const out = await api.fetchExams(2025);
  assert.equal(out.data.examenes.length, 1);
  assert.equal(calls, 3, 'should have retried twice before succeeding');
});

test('retries the JSON error envelope returned with a 200', async () => {
  let calls = 0;
  handler = (_u, res) => {
    calls++;
    if (calls < 2) return json(res, 200, errorEnvelope);
    json(res, 200, envelope([baseRow]));
  };
  await api.fetchExams(2025);
  assert.equal(calls, 2);
});

test('gives up with a clear message after a sustained outage', async () => {
  handler = (_u, res) => json(res, 500, errorEnvelope);
  await assert.rejects(() => api.fetchExams(2025), /Giving up.*after 4 attempts/s);
});

test('retries an HTML maintenance page rather than parsing it as data', async () => {
  handler = (_u, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html><body>Mantenimiento</body></html>');
  };
  await assert.rejects(() => api.fetchExams(2025), /Giving up/);
});

test('a hung socket trips the timeout and is retried', async () => {
  let calls = 0;
  handler = (_u, res) => {
    calls++;
    if (calls === 1) return; // never respond: force the timeout
    json(res, 200, envelope([baseRow]));
  };
  const out = await api.fetchExams(2025);
  assert.equal(out.data.examenes.length, 1);
  assert.equal(calls, 2);
});

test('a 4xx fails immediately without retrying (our bug, not theirs)', async () => {
  let calls = 0;
  handler = (_u, res) => {
    calls++;
    res.writeHead(400);
    res.end();
  };
  await assert.rejects(() => api.fetchExams(999999), /Client error 400/);
  assert.equal(calls, 1, 'must not retry a client error');
});

test('a redirect fails fast — the API moved or now needs auth', async () => {
  handler = (_u, res) => {
    res.writeHead(302, { location: 'https://intranet.upv.es/sso' });
    res.end();
  };
  await assert.rejects(() => api.fetchExams(2025), /Unexpected redirect \(302\)/);
});

test('malformed JSON is retried, then reported', async () => {
  handler = (_u, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"data": {"examenes": [');
  };
  await assert.rejects(() => api.fetchExams(2025), /Giving up/);
});

test('a contract change fails fast and names the offending field', async () => {
  const { dia, ...rest } = baseRow;
  handler = (_u, res) => json(res, 200, envelope([{ ...rest, fecha: dia }]));
  await assert.rejects(() => api.fetchExams(2025), /layout may have changed.*dia/s);
});

test('an oversized body is rejected', async () => {
  handler = (_u, res) => {
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': String(21 * 1024 * 1024) });
    res.end('{}');
  };
  await assert.rejects(() => api.fetchExams(2025), /too large/);
});
