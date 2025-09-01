import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
import { CalendarDisplay } from '@/components/calendar-display';
import { getExams, getDegrees, getSubjects, getFilteredAcronyms } from '@/actions/exam-actions';

// Allow time for real Supabase queries
jest.setTimeout(30000);

// Mock the auth context
const mockUser = {
	id: 'user-123',
	email: 'test@example.com',
	user_metadata: { full_name: 'John Doe' },
};

jest.mock('@/context/auth-context', () => ({
	useAuth: () => ({
		user: mockUser,
		syncToken: jest.fn(),
		loading: false,
	}),
}));

// Mock the settings context
jest.mock('@/context/settings-context', () => ({
	useSettings: () => ({
		settings: {
			viewMode: 'calendar',
			theme: 'light',
		},
		updateSettings: jest.fn(),
	}),
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
	useToast: () => ({ toast: mockToast }),
}));

// We'll use the actual database functions, not mocks, for real validation
// Only mock the components that don't affect data validation

// Mock the user calendars actions
jest.mock('@/actions/user-calendars', () => ({
	saveUserCalendar: jest.fn(),
	getUserCalendarNames: jest.fn().mockResolvedValue([]),
}));

// Mock the auth helpers
jest.mock('@/utils/auth-helpers', () => ({
	getCurrentSession: jest.fn(),
	getFreshAuthTokens: jest.fn(),
}));

// Mock the date utils to have predictable months
jest.mock('@/utils/date-utils', () => ({
	formatDateString: jest.fn((year: number, month: number, day: number) =>
		`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
	),
	getCurrentYear: jest.fn(() => 2024),
	getAcademicYearForMonth: jest.fn(() => ({ startYear: 2023, endYear: 2024 })),
	detectAcademicYearFromExams: jest.fn(() => ({ startYear: 2023, endYear: 2024 })),
	generateAcademicYearMonths: jest.fn(() => [
		{ name: 'September', year: 2023, monthNumber: 9, days: 30 },
		{ name: 'October', year: 2023, monthNumber: 10, days: 31 },
		{ name: 'November', year: 2023, monthNumber: 11, days: 30 },
		{ name: 'December', year: 2023, monthNumber: 12, days: 31 },
		{ name: 'January', year: 2024, monthNumber: 1, days: 31 },
		{ name: 'February', year: 2024, monthNumber: 2, days: 29 },
		{ name: 'March', year: 2024, monthNumber: 3, days: 31 },
		{ name: 'April', year: 2024, monthNumber: 4, days: 30 },
		{ name: 'May', year: 2024, monthNumber: 5, days: 31 },
		{ name: 'June', year: 2024, monthNumber: 6, days: 30 },
		{ name: 'July', year: 2024, monthNumber: 7, days: 31 },
		{ name: 'August', year: 2024, monthNumber: 8, days: 31 },
	]),
}));

// Mock the filter data hook to return loading state initially
// We'll test the actual data fetching functions separately
jest.mock('@/lib/hooks/use-filter-data', () => ({
	useFilterData: () => ({
		schools: ['ETSINF'],
		degrees: [],
		semesters: ['A', 'B'],
		years: [1, 2, 3, 4],
		subjects: [],
		isLoading: false,
		error: null,
	}),
}));

// Mock dialog components
jest.mock('@/components/save-calendar-dialog', () => ({
	SaveCalendarDialog: ({ open }: any) => (open ? <div data-testid="save-calendar-dialog" /> : null),
}));

jest.mock('@/components/export-calendar-dialog', () => ({
	ExportCalendarDialog: ({ open }: any) => (open ? <div data-testid="export-calendar-dialog" /> : null),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
	},
	AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock next/themes
jest.mock('next-themes', () => ({
	useTheme: () => ({ theme: 'light' }),
}));

// Mock next/image
jest.mock('next/image', () => ({
	__esModule: true,
	default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock window.location
Object.defineProperty(window, 'location', {
	value: { origin: 'https://upv-cal.vercel.app' },
	writable: true,
});

describe('ETSINF database distincts vs landing calendar', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	// Validate environment setup before running tests
	beforeAll(() => {
		if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
			console.error('Missing Supabase environment variables:');
			console.error('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
			console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
			console.error('Please ensure .env.local file exists with proper Supabase credentials');
		}
	});

    it('scans ETSINF in DB, computes distincts, and matches CalendarDisplay', async () => {
        // Use semesters A and B as a "meaningful" filter so CalendarDisplay fetches data
        const baseFilters = { school: ['ETSINF'], semester: ['A', 'B'] } as const;

        // 1) Query Supabase via actions for ETSINF with the same filters the calendar will use
        const [dbExams, dbDegrees, dbSubjects, dbAcronyms] = await Promise.all([
            getExams(baseFilters as any),
            getDegrees(['ETSINF']),
            getSubjects(['ETSINF']),
            getFilteredAcronyms('ETSINF'), // all acronyms for ETSINF, any degree
        ]);

		// Compute distinct sets from the raw exams to cross-check the actions
		const totalExamsDB = dbExams.length;
		const degreesFromExams = Array.from(new Set(dbExams.map((e: any) => e.degree))).sort();
		const acronymsFromExams = Array.from(new Set(dbExams.map((e: any) => e.acronym).filter(Boolean))).sort();
		const subjectsFromExams = Array.from(new Set(dbExams.map((e: any) => (
			// Match getSubjects formatting: include acronym if present
			e.acronym ? `${e.subject} (${e.acronym})` : e.subject
		)))).sort();

		// Actions should reflect the same distincts as computed from exams
		expect(degreesFromExams).toEqual([...dbDegrees].sort());
		expect(acronymsFromExams).toEqual([...dbAcronyms].sort());
		expect(subjectsFromExams).toEqual([...dbSubjects].sort());

		// 2) Render the landing calendar view (CalendarDisplay) filtered to ETSINF
		const onExamsChange = jest.fn();
        render(
            <CalendarDisplay
                activeFilters={baseFilters as any}
                onExamsChange={onExamsChange}
            />
        );

		// Wait for CalendarDisplay to load exams
		let calendarExams: any[] = [];
		await waitFor(() => {
			expect(onExamsChange).toHaveBeenCalled();
			calendarExams = onExamsChange.mock.calls.pop()?.[0] as any[];
			expect(Array.isArray(calendarExams)).toBe(true);
			expect(calendarExams.length).toBeGreaterThan(0);
		});

		// The number shown in the UI should match DB count
		expect(calendarExams.length).toBe(totalExamsDB);
		await waitFor(() => {
			const expectedText = new RegExp(`Se encontraron ${totalExamsDB} exámenes`);
			expect(screen.getByText(expectedText)).toBeInTheDocument();
		});

		// Cross-check distincts computed from the calendar data echo the DB sets
		const degreesFromCalendar = Array.from(new Set(calendarExams.map((e: any) => e.degree))).sort();
		const acronymsFromCalendar = Array.from(new Set(calendarExams.map((e: any) => e.acronym).filter(Boolean))).sort();
		const subjectsFromCalendar = Array.from(new Set(calendarExams.map((e: any) => (
			e.acronym ? `${e.subject} (${e.acronym})` : e.subject
		)))).sort();

		expect(degreesFromCalendar).toEqual(degreesFromExams);
		expect(acronymsFromCalendar).toEqual(acronymsFromExams);
		expect(subjectsFromCalendar).toEqual(subjectsFromExams);
	});

    // The previous CSV/constant-based tests were removed in favor of dynamic DB-driven checks above.
});


