import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '@/components/view-toggle';

// The component only uses translations to label the two tabs. We're testing the
// toggle behaviour, not the i18n system, so map the two keys to fixed labels.
jest.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) =>
    ({ 'calendar.viewCalendar': 'Calendario', 'calendar.viewList': 'Lista' }[key] ?? key),
}));

describe('ViewToggle', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderToggle = (view: 'calendar' | 'list' = 'calendar') =>
    render(<ViewToggle view={view} onChange={onChange} />);

  describe('Rendering', () => {
    it('renders a calendar and a list tab', () => {
      renderToggle();

      expect(screen.getByRole('tab', { name: 'Calendario' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Lista' })).toBeInTheDocument();
    });

    it('marks the calendar tab active when view is "calendar"', () => {
      renderToggle('calendar');

      expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: 'Lista' })).toHaveAttribute('data-state', 'inactive');
    });

    it('marks the list tab active when view is "list"', () => {
      renderToggle('list');

      expect(screen.getByRole('tab', { name: 'Lista' })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveAttribute('data-state', 'inactive');
    });
  });

  describe('Interaction', () => {
    it('calls onChange with "list" when the list tab is clicked', async () => {
      const user = userEvent.setup();
      renderToggle('calendar');

      await user.click(screen.getByRole('tab', { name: 'Lista' }));

      expect(onChange).toHaveBeenCalledWith('list');
    });

    it('calls onChange with "calendar" when the calendar tab is clicked', async () => {
      const user = userEvent.setup();
      renderToggle('list');

      await user.click(screen.getByRole('tab', { name: 'Calendario' }));

      expect(onChange).toHaveBeenCalledWith('calendar');
    });

    it('does not call onChange when the already-active tab is clicked', async () => {
      const user = userEvent.setup();
      renderToggle('calendar');

      await user.click(screen.getByRole('tab', { name: 'Calendario' }));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('exposes the tablist and tab roles', () => {
      renderToggle();

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('reflects the active tab via aria-selected', () => {
      renderToggle('calendar');

      expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Lista' })).toHaveAttribute('aria-selected', 'false');
    });
  });
});
