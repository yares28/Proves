import {
  pgrstLiteral,
  normalizeFilters,
  likeLiteral,
  parseSubjects,
  subjectCondition,
} from '@/lib/exam-query';

describe('pgrstLiteral', () => {
  it('wraps a plain value in double quotes', () => {
    expect(pgrstLiteral('Cálculo')).toBe('"Cálculo"');
  });

  // PostgREST treats , ( ) . as grammar. Quoting is what keeps a subject name
  // from being read as more filter rather than as a value.
  it.each([
    ['Redes, protocolos', '"Redes, protocolos"'],
    ['Álgebra (I)', '"Álgebra (I)"'],
    ['Sistemas. Avanzados', '"Sistemas. Avanzados"'],
  ])('quotes structural characters in %s', (input, expected) => {
    expect(pgrstLiteral(input)).toBe(expected);
  });

  it('escapes embedded double quotes so the literal cannot be closed early', () => {
    expect(pgrstLiteral('a"b')).toBe('"a\\"b"');
  });

  it('escapes backslashes before quotes, so an escaped quote cannot be smuggled', () => {
    // Naive quoting would emit "a\"" and let the value escape its own literal.
    expect(pgrstLiteral('a\\')).toBe('"a\\\\"');
  });

  it('neutralises an attempt to inject an extra or() condition', () => {
    const hostile = 'x","or":"(degree.eq.GIINF';
    const out = pgrstLiteral(hostile);
    expect(out.startsWith('"')).toBe(true);
    expect(out.endsWith('"')).toBe(true);
    // every inner quote is escaped, so the literal has no unescaped terminator
    expect(out.slice(1, -1)).not.toMatch(/(?<!\\)"/);
  });
});

describe('likeLiteral', () => {
  it('leaves an ordinary name untouched', () => {
    expect(likeLiteral('Bases de datos')).toBe('Bases de datos');
  });

  it.each([
    ['100% teoría', '100\\% teoría'],
    ['a_b', 'a\\_b'],
    ['a\\b', 'a\\\\b'],
  ])('escapes LIKE wildcards in %s', (input, expected) => {
    expect(likeLiteral(input)).toBe(expected);
  });
});

describe('normalizeFilters', () => {
  it('returns an empty object for no filters', () => {
    expect(normalizeFilters()).toEqual({});
    expect(normalizeFilters({})).toEqual({});
  });

  it('ignores a non-object argument', () => {
    expect(normalizeFilters(null as any)).toEqual({});
    expect(normalizeFilters('nope' as any)).toEqual({});
  });

  it('coerces a bare string to an array', () => {
    expect(normalizeFilters({ school: 'ETSINF' } as any)).toEqual({ school: ['ETSINF'] });
  });

  it('drops blank and non-string values', () => {
    expect(normalizeFilters({ school: ['ETSINF', '', '   ', null as any, 3 as any] }))
      .toEqual({ school: ['ETSINF'] });
  });

  it('omits a key whose values are all blank', () => {
    expect(normalizeFilters({ school: ['', '  '] })).toEqual({});
  });

  it('trims values', () => {
    expect(normalizeFilters({ degree: ['  GIINF  '] })).toEqual({ degree: ['GIINF'] });
  });

  // The cache key is the serialized argument, so two orderings of the same
  // selection must serialize identically or one query gets two cache entries.
  it('produces the same key regardless of value order', () => {
    const a = normalizeFilters({ school: ['ETSA', 'ETSINF'] });
    const b = normalizeFilters({ school: ['ETSINF', 'ETSA'] });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('produces the same key regardless of filter insertion order', () => {
    const a = normalizeFilters({ school: ['ETSINF'], degree: ['GIINF'] });
    const b = normalizeFilters({ degree: ['GIINF'], school: ['ETSINF'] } as any);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('keeps acronym as a trimmed string, dropping it when blank', () => {
    expect(normalizeFilters({ acronym: '  BDA ' })).toEqual({ acronym: 'BDA' });
    expect(normalizeFilters({ acronym: '   ' })).toEqual({});
  });
});

describe('parseSubjects', () => {
  it('splits a trailing acronym from the name', () => {
    expect(parseSubjects(['Bases de datos (BDA)']))
      .toEqual([{ name: 'Bases de datos', acronym: 'BDA' }]);
  });

  it('returns a bare name when there is no acronym', () => {
    expect(parseSubjects(['Bases de datos'])).toEqual([{ name: 'Bases de datos' }]);
  });

  // Only the LAST parenthesised group is the acronym.
  it('splits on the trailing group when the name itself contains parentheses', () => {
    expect(parseSubjects(['English for Computing (B2) (IN2)']))
      .toEqual([{ name: 'English for Computing (B2)', acronym: 'IN2' }]);
  });

  it('trims surrounding whitespace', () => {
    expect(parseSubjects(['  Cálculo  (CAL)  ']))
      .toEqual([{ name: 'Cálculo', acronym: 'CAL' }]);
  });
});

describe('subjectCondition', () => {
  // The acronym is scoped to a degree, so name+acronym together identify a
  // course; matching on acronym alone once showed GCD students GIINF exams.
  it('matches on name AND acronym when both are known', () => {
    expect(subjectCondition({ name: 'Bases de datos', acronym: 'BDA' }))
      .toBe('and(subject.ilike."Bases de datos",acronym.eq."BDA")');
  });

  it('falls back to a contains match when only the name is known', () => {
    expect(subjectCondition({ name: 'Bases de datos' }))
      .toBe('subject.ilike."%Bases de datos%"');
  });

  it('escapes a hostile subject name in both branches', () => {
    const hostile = 'a","b';
    expect(subjectCondition({ name: hostile })).toContain('\\"');
    expect(subjectCondition({ name: hostile, acronym: hostile })).toContain('\\"');
  });

  // likeLiteral escapes the % to \\%, then pgrstLiteral escapes that backslash
  // again, so the value reaching PostgREST carries a literal \\\\ before the %.
  it('escapes LIKE wildcards so they are not treated as patterns', () => {
    expect(subjectCondition({ name: '100% teoría', acronym: 'X' }))
      .toBe('and(subject.ilike."100\\\\% teoría",acronym.eq."X")');
  });
});
