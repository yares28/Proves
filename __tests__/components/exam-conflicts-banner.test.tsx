/**
 * The banner is how the conflict detection reaches the user. Its rules matter:
 * it must stay silent when there is nothing wrong, must lead with the worst
 * severity present (an unattendable clash outranks a merely busy day), and must
 * keep the detail collapsed until asked for.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExamConflictsBanner } from '@/components/exam-conflicts-banner';
import type { DayConflict } from '@/lib/exam-conflicts';

jest.mock('@/context/settings-context', () => ({
  useSettings: () => ({ settings: { language: 'es' } }),
}));

jest.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

const exam = (id: number, subject: string, time: string) =>
  ({ id, subject, time, duration_minutes: 120, location: 'A-1' }) as any;

const day = (date: string, severity: DayConflict['severity']): DayConflict => ({
  date,
  severity,
  exams: [exam(id++, 'Cálculo', '09:00'), exam(id++, 'Álgebra', '09:30')],
  pairs: [],
});
let id = 1;

describe('ExamConflictsBanner', () => {
  it('renders nothing when there are no conflicts', () => {
    const { container } = render(<ExamConflictsBanner conflicts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('uses the singular message for a single affected day', () => {
    render(<ExamConflictsBanner conflicts={[day('2026-01-15', 'overlap')]} />);
    expect(screen.getByText('conflict.oneDay')).toBeInTheDocument();
  });

  it('passes the day count for several affected days', () => {
    render(
      <ExamConflictsBanner
        conflicts={[day('2026-01-15', 'busy'), day('2026-01-16', 'busy')]}
      />
    );
    expect(screen.getByText('conflict.manyDays:{"count":2}')).toBeInTheDocument();
  });

  it('keeps the detail collapsed until the user asks for it', async () => {
    const user = userEvent.setup();
    render(<ExamConflictsBanner conflicts={[day('2026-01-15', 'overlap')]} />);

    expect(screen.getByText('conflict.summary')).toBeInTheDocument();
    expect(screen.queryByText('conflict.overlapHint')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /conflict.seeDetail/ }));

    expect(screen.getByText('conflict.overlapHint')).toBeInTheDocument();
    expect(screen.queryByText('conflict.summary')).not.toBeInTheDocument();
  });

  it('collapses again on a second click', async () => {
    const user = userEvent.setup();
    render(<ExamConflictsBanner conflicts={[day('2026-01-15', 'tight')]} />);

    await user.click(screen.getByRole('button', { name: /conflict.seeDetail/ }));
    await user.click(screen.getByRole('button', { name: /conflict.hide/ }));

    expect(screen.getByText('conflict.summary')).toBeInTheDocument();
  });

  // An unattendable clash must dominate the styling even when most days are
  // only busy, otherwise the serious case is visually indistinguishable.
  it('escalates to the destructive variant when any day overlaps', () => {
    const { container } = render(
      <ExamConflictsBanner
        conflicts={[day('2026-01-15', 'busy'), day('2026-01-16', 'overlap')]}
      />
    );
    expect(container.querySelector('[role="alert"]')?.className).not.toContain('amber');
  });

  it('uses the softer variant when nothing actually overlaps', () => {
    const { container } = render(
      <ExamConflictsBanner conflicts={[day('2026-01-15', 'busy')]} />
    );
    expect(container.querySelector('[role="alert"]')?.className).toContain('amber');
  });

  it('lists the exams of an expanded day in chronological order', async () => {
    const user = userEvent.setup();
    const conflict: DayConflict = {
      date: '2026-01-15',
      severity: 'overlap',
      exams: [exam(90, 'Tarde', '16:00'), exam(91, 'Mañana', '08:00')],
      pairs: [],
    };
    render(<ExamConflictsBanner conflicts={[conflict]} />);

    await user.click(screen.getByRole('button', { name: /conflict.seeDetail/ }));

    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('08:00');
    expect(items[1]).toContain('16:00');
  });
});
