import {
  remindersToIso,
  buildIcsQuery,
  buildGoogleCalendarUrl,
} from '@/lib/calendar-export';

describe('remindersToIso', () => {
  it('maps enabled reminder settings to ISO offsets', () => {
    expect(remindersToIso({ oneHour: true, oneDay: true, oneWeek: false })).toEqual([
      '-PT1H',
      '-P1D',
    ]);
    expect(remindersToIso({ oneWeek: true })).toEqual(['-P1W']);
    expect(remindersToIso(undefined)).toEqual([]);
  });
});

describe('buildIcsQuery', () => {
  it('serializes array and scalar filter values', () => {
    const qs = buildIcsQuery(
      { school: ['ETSINF'], degree: 'GIINF', subject: ['A', 'B'] },
      { name: 'Mis Exámenes', reminders: ['-P1D'] }
    );
    const params = new URLSearchParams(qs);
    expect(params.getAll('school')).toEqual(['ETSINF']);
    expect(params.get('degree')).toBe('GIINF');
    expect(params.getAll('subject')).toEqual(['A', 'B']);
    expect(params.get('name')).toBe('Mis Exámenes');
    expect(params.getAll('reminder')).toEqual(['-P1D']);
  });

  it('skips empty values', () => {
    const qs = buildIcsQuery({ school: ['', '  '], acronym: undefined });
    expect(qs).toBe('');
  });
});

describe('buildGoogleCalendarUrl', () => {
  it('builds a Google Calendar "add by URL" deep link with a webcal feed', () => {
    const url = buildGoogleCalendarUrl(
      { school: ['ETSINF'] },
      { origin: 'https://www.upvcal.com', name: 'Exámenes UPV' }
    );
    const parsed = new URL(url);
    expect(parsed.host).toBe('calendar.google.com');
    expect(parsed.pathname).toBe('/calendar/render');

    const cid = parsed.searchParams.get('cid')!;
    expect(cid.startsWith('webcal://www.upvcal.com/api/ical?')).toBe(true);
    expect(cid).toContain('school=ETSINF');
  });
});
