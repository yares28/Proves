import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FilterSidebar } from '@/components/filter-sidebar';
import type { FilterOptions } from '@/types/exam';
import type { Locale } from '@/lib/i18n';

/**
 * These use fireEvent rather than userEvent. userEvent's synthetic pointer
 * sequence does not drive Radix's Checkbox under jsdom — the click lands but
 * onCheckedChange never runs — while fireEvent exercises the same handler a real
 * click does. The real pointer path is covered in the browser, not here.
 */

/**
 * FilterSidebar is controlled: the selection lives in the URL and arrives as the
 * `filters` prop, and every interaction reports the *next* selection through
 * onFiltersChange. So these tests assert on what the sidebar reports upward and
 * on what it renders for a given selection — not on internal state, which it no
 * longer has.
 */

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, syncToken: jest.fn(), loading: false }),
}));

jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));

jest.mock('@/actions/user-calendars', () => ({
  saveUserCalendar: jest.fn(),
  getUserCalendarNames: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/utils/auth-helpers', () => ({ getFreshAuthTokens: jest.fn() }));

jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'dark' }) }));

jest.mock('@/context/settings-context', () => ({
  useSettings: () => ({ settings: { theme: 'dark', language }, updateSettings: jest.fn() }),
}));

// Any motion.<tag> renders as that plain tag; the component uses aside and div.
jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Component = ({ children, ...props }: any) => {
          const { initial, animate, exit, whileInView, viewport, transition, whileHover, whileTap, ...rest } = props;
          return React.createElement(tag, rest, children);
        };
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const OPTIONS: FilterOptions = {
  schools: ['ETSA', 'ETSINF'],
  degrees: ['GCD', 'GIINF'],
  semesters: ['A', 'B'],
  years: [1, 2],
  subjects: [
    { value: 'Programación (PRG)', va: 'Programació (PRG)', en: 'Programming (PRG)' },
    // Untranslated upstream, as the ETSA rows are: falls back to `value`.
    { value: 'Álgebra (ALG)' },
  ],
};

let language: Locale = 'es';

beforeEach(() => {
  language = 'es';
});

function renderSidebar(filters: Record<string, string[]> = {}, options: FilterOptions = OPTIONS) {
  const onFiltersChange = jest.fn();
  render(<FilterSidebar filters={filters} options={options} onFiltersChange={onFiltersChange} />);
  return { onFiltersChange };
}

describe('FilterSidebar', () => {
  describe('rendering', () => {
    it('renders every filter category', () => {
      renderSidebar();

      expect(screen.getByText('Filtros')).toBeInTheDocument();
      expect(screen.getByText('Escuelas')).toBeInTheDocument();
      expect(screen.getByText('Carreras')).toBeInTheDocument();
      expect(screen.getByText('Semestres')).toBeInTheDocument();
      expect(screen.getByText('Años del Curso')).toBeInTheDocument();
      expect(screen.getByText('Asignaturas')).toBeInTheDocument();
    });

    it('renders the options it was given', () => {
      renderSidebar();

      expect(screen.getByLabelText('ETSINF')).toBeInTheDocument();
      expect(screen.getByLabelText('ETSA')).toBeInTheDocument();
    });

    it('reflects the incoming selection as checked boxes', () => {
      renderSidebar({ school: ['ETSINF'] });

      expect(screen.getByLabelText('ETSINF')).toBeChecked();
      expect(screen.getByLabelText('ETSA')).not.toBeChecked();
    });

    it('offers saving only once something is selected', () => {
      const { rerender } = render(
        <FilterSidebar filters={{}} options={OPTIONS} onFiltersChange={jest.fn()} />
      );
      expect(screen.queryByText('Guardar Calendario')).not.toBeInTheDocument();

      rerender(
        <FilterSidebar filters={{ school: ['ETSINF'] }} options={OPTIONS} onFiltersChange={jest.fn()} />
      );
      expect(screen.getByText('Guardar Calendario')).toBeInTheDocument();
    });
  });

  describe('reporting changes', () => {
    it('reports a school selection', () => {
      const { onFiltersChange } = renderSidebar();

      fireEvent.click(screen.getByLabelText('ETSINF'));

      expect(onFiltersChange).toHaveBeenCalledWith({ school: ['ETSINF'] });
    });

    it('adds to an existing selection rather than replacing it', () => {
      const { onFiltersChange } = renderSidebar({ school: ['ETSA'] });

      fireEvent.click(screen.getByLabelText('ETSINF'));

      expect(onFiltersChange).toHaveBeenCalledWith({ school: ['ETSA', 'ETSINF'] });
    });

    it('reports a deselection', () => {
      const { onFiltersChange } = renderSidebar({ school: ['ETSA', 'ETSINF'] });

      fireEvent.click(screen.getByLabelText('ETSA'));

      expect(onFiltersChange).toHaveBeenCalledWith({ school: ['ETSINF'] });
    });

    it('clears the whole selection', () => {
      const { onFiltersChange } = renderSidebar({ school: ['ETSINF'], degree: ['GIINF'] });

      // The header's clear-all, not a category's.
      fireEvent.click(screen.getAllByText('Limpiar todo')[0]);

      expect(onFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('cascade', () => {
    // Choosing a school invalidates the degree under it, and a degree
    // invalidates the semester/year under that. Leaving them selected would
    // silently filter against a combination the user never chose.
    it('drops the degree when the school changes', () => {
      const { onFiltersChange } = renderSidebar({ school: ['ETSA'], degree: ['GCD'] });

      fireEvent.click(screen.getByLabelText('ETSINF'));

      expect(onFiltersChange).toHaveBeenCalledWith({ school: ['ETSA', 'ETSINF'] });
    });

    it('drops semester and year when the degree changes', () => {
      const { onFiltersChange } = renderSidebar({
        school: ['ETSINF'],
        degree: ['GCD'],
        semester: ['A'],
        year: ['1'],
      });

      fireEvent.click(screen.getByLabelText('GIINF'));

      expect(onFiltersChange).toHaveBeenCalledWith({
        school: ['ETSINF'],
        degree: ['GCD', 'GIINF'],
      });
    });

    it('keeps subjects when a school is added, since they may still apply', () => {
      const { onFiltersChange } = renderSidebar({
        school: ['ETSA'],
        subject: ['Programación (PRG)'],
      });

      fireEvent.click(screen.getByLabelText('ETSINF'));

      expect(onFiltersChange).toHaveBeenCalledWith({
        school: ['ETSA', 'ETSINF'],
        subject: ['Programación (PRG)'],
      });
    });
  });

  describe('dependencies', () => {
    it('does not offer degrees before a school is chosen', () => {
      renderSidebar({}, { ...OPTIONS, degrees: [] });

      expect(screen.queryByLabelText('GIINF')).not.toBeInTheDocument();
    });

    it('offers degrees once a school is chosen', () => {
      renderSidebar({ school: ['ETSINF'] });

      expect(screen.getByLabelText('GIINF')).toBeInTheDocument();
    });
  });

  describe('language', () => {
    it('labels subjects in Castellano by default', () => {
      renderSidebar({ school: ['ETSINF'] });

      expect(screen.getByLabelText('Programación (PRG)')).toBeInTheDocument();
    });

    it('labels subjects in Valencià when chosen', () => {
      language = 'va';
      renderSidebar({ school: ['ETSINF'] });

      expect(screen.getByLabelText('Programació (PRG)')).toBeInTheDocument();
    });

    it('labels subjects in English when chosen', () => {
      language = 'en';
      renderSidebar({ school: ['ETSINF'] });

      expect(screen.getByLabelText('Programming (PRG)')).toBeInTheDocument();
    });

    it('falls back to Castellano for untranslated subjects', () => {
      language = 'va';
      renderSidebar({ school: ['ETSINF'] });

      expect(screen.getByLabelText('Álgebra (ALG)')).toBeInTheDocument();
    });

    // The value is the identity: it is what the URL carries and what
    // user_calendars.filters stores. Reporting a Valencià label upward would
    // silently orphan every calendar saved before the language was switched.
    it('still reports the Castellano value when displaying Valencià', () => {
      language = 'va';
      const { onFiltersChange } = renderSidebar({ school: ['ETSINF'] });

      fireEvent.click(screen.getByLabelText('Programació (PRG)'));

      expect(onFiltersChange).toHaveBeenCalledWith({
        school: ['ETSINF'],
        subject: ['Programación (PRG)'],
      });
    });
  });

  // Only subjects get a search box — there are 300+ of them, and a handful of
  // schools. It appears once a school or degree narrows the list.
  describe('subject search', () => {
    const search = () => screen.getByPlaceholderText('Buscar asignaturas...');

    it('narrows subjects to matching options', () => {
      renderSidebar({ school: ['ETSINF'] });

      fireEvent.change(search(), { target: { value: 'Programa' } });

      expect(screen.getByLabelText('Programación (PRG)')).toBeInTheDocument();
      expect(screen.queryByLabelText('Álgebra (ALG)')).not.toBeInTheDocument();
    });

    it('restores every subject when the search is cleared', () => {
      renderSidebar({ school: ['ETSINF'] });

      fireEvent.change(search(), { target: { value: 'Programa' } });
      fireEvent.change(search(), { target: { value: '' } });

      expect(screen.getByLabelText('Programación (PRG)')).toBeInTheDocument();
      expect(screen.getByLabelText('Álgebra (ALG)')).toBeInTheDocument();
    });

    it('has no search box before a school or degree is chosen', () => {
      renderSidebar();

      expect(screen.queryByPlaceholderText('Buscar asignaturas...')).not.toBeInTheDocument();
    });
  });

  describe('empty options', () => {
    it('says so instead of rendering an empty list', () => {
      renderSidebar({}, { schools: [], degrees: [], semesters: [], years: [], subjects: [] });

      // Empty categories stay collapsed, and Radix unmounts closed panels.
      fireEvent.click(screen.getByText('Escuelas'));

      expect(screen.getByText(/No hay escuelas disponibles/i)).toBeInTheDocument();
    });
  });
});
