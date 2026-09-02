/**
 * The export button is the entry point to the subscribe flow: it must hand
 * openInGoogleCalendar the *current* filters, and must stay inert when there is
 * nothing to export.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from '@/components/export-button';

const mockOpen = jest.fn();
jest.mock('@/lib/calendar-export', () => ({
  openInGoogleCalendar: (...args: unknown[]) => mockOpen(...args),
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));

const exam = { id: 1, subject: 'Cálculo', code: 'CAL', date: '2026-01-15' } as any;

describe('ExportButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is disabled when there are no exams to export', () => {
    render(<ExportButton exams={[]} filters={{}} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled once there is at least one exam', () => {
    render(<ExportButton exams={[exam]} filters={{}} />);
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('opens the subscribe flow with the active filters', async () => {
    const user = userEvent.setup();
    const filters = { school: ['ETSINF'], degree: ['GIINF'] };
    render(<ExportButton exams={[exam]} filters={filters} />);

    await user.click(screen.getByRole('button'));

    expect(mockOpen).toHaveBeenCalledWith(filters, { name: 'Exámenes UPV' });
  });

  it('confirms to the user that the flow has opened', async () => {
    const user = userEvent.setup();
    render(<ExportButton exams={[exam]} filters={{}} />);

    await user.click(screen.getByRole('button'));

    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('does nothing when clicked with an empty exam list', async () => {
    const user = userEvent.setup();
    render(<ExportButton exams={[]} filters={{}} />);

    await user.click(screen.getByRole('button'), { pointerEventsCheck: 0 });

    expect(mockOpen).not.toHaveBeenCalled();
  });
});
