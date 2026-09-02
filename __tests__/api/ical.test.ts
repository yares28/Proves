/**
 * Tests for the public iCalendar feed. This route is the whole export feature:
 * the "subscribe from Google Calendar" flow is just a link to it, so a
 * regression here breaks the headline feature silently — the page still loads,
 * the calendar just stops updating.
 */
import { GET } from '@/app/api/ical/route';

const mockGetExams = jest.fn();
jest.mock('@/actions/exam-actions', () => ({
  getExams: (...args: unknown[]) => mockGetExams(...args),
}));

const mockBuildIcs = jest.fn();
jest.mock('@/lib/ics', () => ({
  ...jest.requireActual('@/lib/ics'),
  buildIcs: (...args: unknown[]) => mockBuildIcs(...args),
}));

// The route builds a real Response; jsdom provides one, so only NextResponse
// needs standing in for.
jest.mock('next/server', () => ({
  NextResponse: class {
    body: string;
    status: number;
    headers: Map<string, string>;
    constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }
    static json(data: unknown, init?: { status?: number }) {
      const r = new (jest.requireMock('next/server').NextResponse)(JSON.stringify(data), init);
      (r as any).isJson = true;
      (r as any).payload = data;
      return r;
    }
  },
}));

const request = (query: string) =>
  ({ nextUrl: new URL(`http://localhost:3000/api/ical${query}`) } as any);

describe('GET /api/ical', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExams.mockResolvedValue([]);
    mockBuildIcs.mockReturnValue('BEGIN:VCALENDAR\r\nEND:VCALENDAR');
  });

  it('serves the feed with calendar content-type and caching headers', async () => {
    const res: any = await GET(request('?school=ETSINF'));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8');
    expect(res.headers.get('Content-Disposition')).toContain('upv-examenes.ics');
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600');
    expect(res.body).toContain('BEGIN:VCALENDAR');
  });

  it('passes no filters through when the query is empty', async () => {
    await GET(request(''));
    expect(mockGetExams).toHaveBeenCalledWith({});
  });

  it('collects repeated parameters into an array', async () => {
    await GET(request('?school=ETSINF&school=ETSA'));
    expect(mockGetExams).toHaveBeenCalledWith({ school: ['ETSINF', 'ETSA'] });
  });

  it('splits comma-separated parameters', async () => {
    await GET(request('?degree=GIINF,GCD'));
    expect(mockGetExams).toHaveBeenCalledWith({ degree: ['GIINF', 'GCD'] });
  });

  it('trims blanks and drops empty entries', async () => {
    await GET(request('?year=1, ,2,'));
    expect(mockGetExams).toHaveBeenCalledWith({ year: ['1', '2'] });
  });

  it('carries every supported filter', async () => {
    await GET(request('?school=ETSINF&degree=GIINF&year=2&semester=A&subject=BDA&acronym=BDA'));
    expect(mockGetExams).toHaveBeenCalledWith({
      school: ['ETSINF'],
      degree: ['GIINF'],
      year: ['2'],
      semester: ['A'],
      subject: ['BDA'],
      acronym: 'BDA',
    });
  });

  it('defaults the calendar name and honours an override', async () => {
    await GET(request(''));
    expect(mockBuildIcs.mock.calls[0][1]).toMatchObject({ name: 'Calendario de Exámenes UPV' });

    mockBuildIcs.mockClear();
    await GET(request('?name=Mis%20ex%C3%A1menes'));
    expect(mockBuildIcs.mock.calls[0][1]).toMatchObject({ name: 'Mis exámenes' });
  });

  it('converts ISO reminder offsets to minutes and ignores unparseable ones', async () => {
    await GET(request('?reminder=-PT1H&reminder=-P1D&reminder=nonsense'));
    const opts = mockBuildIcs.mock.calls[0][1];
    expect(opts.reminderMinutes).toEqual([60, 1440]);
  });

  it('falls back to Castellano for a missing or unknown language', async () => {
    await GET(request(''));
    expect(mockBuildIcs.mock.calls[0][1]).toMatchObject({ locale: 'es' });

    mockBuildIcs.mockClear();
    await GET(request('?lang=klingon'));
    expect(mockBuildIcs.mock.calls[0][1]).toMatchObject({ locale: 'es' });
  });

  it('honours a supported language', async () => {
    await GET(request('?lang=va'));
    expect(mockBuildIcs.mock.calls[0][1]).toMatchObject({ locale: 'va' });
  });

  it('returns 500 rather than leaking an error when the query fails', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetExams.mockRejectedValue(new Error('supabase is down'));

    const res: any = await GET(request('?school=ETSINF'));

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.payload)).not.toContain('supabase is down');
    spy.mockRestore();
  });
});
