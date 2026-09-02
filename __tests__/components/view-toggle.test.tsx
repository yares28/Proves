import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '@/components/view-toggle';

// The component only uses translations for the two option labels and the group
// label. We're testing the toggle behaviour, not the i18n system, so map those
// keys to fixed labels.
jest.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) =>
    ({
      'calendar.viewCalendar': 'Calendario',
      'calendar.viewList': 'Lista',
      'calendar.viewToggle': 'Vista',
    }[key] ?? key),
}));

describe('ViewToggle', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderToggle = (view: 'calendar' | 'list' = 'calendar') =>
    render(<ViewToggle view={view} onChange={onChange} />);

  describe('Rendering', () => {
    it('renders a calendar and a list option', () => {
      renderToggle();

      expect(screen.getByRole('button', { name: 'Calendario' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Lista' })).toBeInTheDocument();
    });

    it('marks the calendar option active when view is "calendar"', () => {
      renderToggle('calendar');

      expect(screen.getByRole('button', { name: 'Calendario' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('marks the list option active when view is "list"', () => {
      renderToggle('list');

      expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Calendario' })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Interaction', () => {
    it('calls onChange with "list" when the list option is clicked', async () => {
      const user = userEvent.setup();
      renderToggle('calendar');

      await user.click(screen.getByRole('button', { name: 'Lista' }));

      expect(onChange).toHaveBeenCalledWith('list');
    });

    it('calls onChange with "calendar" when the calendar option is clicked', async () => {
      const user = userEvent.setup();
      renderToggle('list');

      await user.click(screen.getByRole('button', { name: 'Calendario' }));

      expect(onChange).toHaveBeenCalledWith('calendar');
    });

    it('does not call onChange when the already-active tab is clicked', async () => {
      const user = userEvent.setup();
      renderToggle('calendar');

      await user.click(screen.getByRole('button', { name: 'Calendario' }));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // This control used to be built on Radix Tabs, which made each option a `tab`
  // pointing via aria-controls at a panel that is rendered elsewhere and so never
  // existed. It is now a labelled group of pressed-state buttons, which is what
  // the control actually is and leaves no dangling ARIA reference.
  describe('Accessibility', () => {
    it('exposes a labelled group containing the two options', () => {
      renderToggle();

      expect(screen.getByRole('group', { name: 'Vista' })).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('reflects the active option via aria-pressed', () => {
      renderToggle('calendar');

      expect(screen.getByRole('button', { name: 'Calendario' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('does not reference any element that is not rendered', () => {
      renderToggle();

      for (const btn of screen.getAllByRole('button')) {
        expect(btn).not.toHaveAttribute('aria-controls');
      }
    });
  });
});
