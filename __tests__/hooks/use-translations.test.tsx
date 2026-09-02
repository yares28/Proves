/**
 * The translation hook is small but carries the rule that keeps the UI from
 * ever showing a raw key to a user: fall back to Castellano when a locale is
 * missing a string, and only then to the key itself.
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useTranslations } from '@/hooks/use-translations';

let mockLanguage = 'es';
jest.mock('@/context/settings-context', () => ({
  useSettings: () => ({ settings: { language: mockLanguage } }),
}));

const t = () => renderHook(() => useTranslations()).result.current;

describe('useTranslations', () => {
  beforeEach(() => { mockLanguage = 'es'; });

  it('returns the Castellano string by default', () => {
    expect(t()('calendar.viewList')).toBe('Lista');
  });

  it('returns the Valencian string when the locale is va', () => {
    mockLanguage = 'va';
    expect(t()('calendar.viewList')).toBe('Llista');
  });

  it('returns the English string when the locale is en', () => {
    mockLanguage = 'en';
    expect(t()('calendar.viewList')).toBe('List');
  });

  // va/en are Partial catalogues, so any untranslated key must degrade to
  // Castellano rather than surfacing the key.
  it('falls back to Castellano for a key missing from the active locale', () => {
    mockLanguage = 'en';
    const enValue = t()('conflict.noTime');
    expect(typeof enValue).toBe('string');
    expect(enValue).not.toBe('conflict.noTime');
  });

  it('falls back to an unknown locale as Castellano', () => {
    mockLanguage = 'klingon';
    expect(t()('calendar.viewList')).toBe('Lista');
  });

  it('returns the key itself when it exists in no catalogue', () => {
    expect(t()('does.not.exist' as never)).toBe('does.not.exist');
  });

  it('substitutes a named placeholder', () => {
    expect(t()('calendar.found', { count: 7 })).toContain('7');
  });

  it('substitutes every occurrence of the same placeholder', () => {
    const out = t()('filters.search', { category: 'escuelas' });
    expect(out).toContain('escuelas');
    expect(out).not.toContain('{category}');
  });

  it('leaves placeholders intact when no params are supplied', () => {
    expect(t()('calendar.found')).toContain('{count}');
  });
});
