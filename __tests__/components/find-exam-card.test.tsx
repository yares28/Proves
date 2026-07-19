import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { FindExamCard } from '@/components/find-exam-card';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn() }),
}));

// Real useTranslations reads settings.language; 'es' → Castellano labels.
jest.mock('@/context/settings-context', () => ({
  useSettings: () => ({ settings: { language: 'es' }, updateSettings: jest.fn() }),
}));

// Self-contained so the exam-action mocks aren't dereferenced at module load.
jest.mock('@/actions/exam-actions', () => ({
  getSchools: jest.fn().mockResolvedValue([]),
  getDegrees: jest.fn().mockResolvedValue([]),
  getFilteredAcronymsAndSubjects: jest.fn().mockResolvedValue([]),
}));

const actions = jest.requireMock('@/actions/exam-actions') as {
  getSchools: jest.Mock;
  getDegrees: jest.Mock;
  getFilteredAcronymsAndSubjects: jest.Mock;
};

describe('FindExamCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    actions.getSchools.mockResolvedValue([]);
    actions.getDegrees.mockResolvedValue([]);
    actions.getFilteredAcronymsAndSubjects.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the card title and the school/degree labels', async () => {
    render(<FindExamCard />);

    expect(screen.getByText('Encuentra tu Examen')).toBeInTheDocument();
    expect(screen.getByText('Escuela')).toBeInTheDocument();
    expect(screen.getByText('Carrera')).toBeInTheDocument();
    // Let the mount-time fetch settle to avoid act() warnings.
    await waitFor(() => expect(actions.getSchools).toHaveBeenCalled());
  });

  it('fetches schools on mount and shows the available count', async () => {
    actions.getSchools.mockResolvedValue(['ETSINF', 'ADE']);
    render(<FindExamCard />);

    expect(await screen.findByText('2 escuelas disponibles')).toBeInTheDocument();
    expect(actions.getSchools).toHaveBeenCalledTimes(1);
  });

  it('shows a zero count when loading schools fails', async () => {
    actions.getSchools.mockRejectedValue(new Error('network'));
    render(<FindExamCard />);

    expect(await screen.findByText('0 escuelas disponibles')).toBeInTheDocument();
  });

  it('disables the search button until a subject or acronym is selected', async () => {
    render(<FindExamCard />);

    const searchButton = await screen.findByRole('button', { name: 'Buscar Exámenes' });
    expect(searchButton).toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('keeps the acronym combobox disabled until school and degree are chosen', async () => {
    render(<FindExamCard />);

    expect(await screen.findByText('Selecciona escuela y carrera primero')).toBeInTheDocument();
  });
});
