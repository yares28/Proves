// Mock Supabase first before any imports
jest.mock('@supabase/supabase-js', () => {
  const mockGetSession = jest.fn();
  return {
    createClient: jest.fn(() => ({
      auth: {
        getSession: mockGetSession,
        refreshSession: jest.fn(),
        onAuthStateChange: jest.fn(),
      },
    })),
  };
});

import { checkAndFixAuthState, fixAuth, syncAuthState, isAuthenticated } from '../auth-helpers';
import { createClient } from '@supabase/supabase-js';

// Get the mocked functions for testing
const mockSupabase = createClient('', '') as any;
const mockGetSession = mockSupabase.auth.getSession;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console
const consoleMock = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
Object.defineProperty(console, 'log', { value: consoleMock.log });
Object.defineProperty(console, 'warn', { value: consoleMock.warn });
Object.defineProperty(console, 'error', { value: consoleMock.error });

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    consoleMock.log.mockClear();
    consoleMock.warn.mockClear();
    consoleMock.error.mockClear();
  });

  describe('checkAndFixAuthState', () => {
    it('returns false when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      
      const result = await checkAndFixAuthState();
      
      expect(result).toBe(false);
      expect(mockGetSession).toHaveBeenCalled();
    });

    it('fixes localStorage when session exists but token is wrong', async () => {
      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: 'user-123' },
      };
      
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      localStorageMock.getItem.mockReturnValue('true'); // Wrong token format
      
      const result = await checkAndFixAuthState();
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        JSON.stringify({ currentSession: mockSession })
      );
    });

    it('returns false when session exists and token is correct', async () => {
      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: 'user-123' },
      };
      
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ currentSession: mockSession }));
      
      const result = await checkAndFixAuthState();
      
      expect(result).toBe(false);
    });
  });

  describe('fixAuth', () => {
    it('fixes auth when session exists', async () => {
      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: 'user-123' },
      };
      
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      
      const result = await fixAuth();
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        JSON.stringify({ currentSession: mockSession })
      );
      expect(consoleMock.log).toHaveBeenCalledWith("Session fixed, try the My Calendar button now");
    });

    it('returns false when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      
      const result = await fixAuth();
      
      expect(result).toBe(false);
      expect(consoleMock.log).toHaveBeenCalledWith("No active session found, please log in first");
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when session exists', async () => {
      const mockSession = {
        access_token: 'access-token',
        user: { id: 'user-123' },
      };
      
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      
      const result = await isAuthenticated();
      
      expect(result).toBe(true);
    });

    it('returns false when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      
      const result = await isAuthenticated();
      
      expect(result).toBe(false);
    });

    it('returns false when an error occurs', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'));
      
      const result = await isAuthenticated();
      
      expect(result).toBe(false);
      expect(consoleMock.error).toHaveBeenCalledWith(
        'Error checking authentication state:',
        expect.any(Error)
      );
    });
  });

  describe('syncAuthState', () => {
    // Mock document.cookie and window.location for these tests
    beforeEach(() => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { hostname: 'localhost' },
      });
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    it('syncs auth state successfully when session exists', async () => {
      const mockSession = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: { id: 'user-123' },
      };
      
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      
      const result = await syncAuthState();
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase.auth.token',
        JSON.stringify({ currentSession: mockSession })
      );
      expect(consoleMock.log).toHaveBeenCalledWith('Auth state synchronized successfully');
    });

    it('returns false when no session exists', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      
      const result = await syncAuthState();
      
      expect(result).toBe(false);
      expect(consoleMock.warn).toHaveBeenCalledWith('No active session found when syncing auth state');
    });

    it('handles errors gracefully', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'));
      
      const result = await syncAuthState();
      
      expect(result).toBe(false);
      expect(consoleMock.error).toHaveBeenCalledWith(
        'Error synchronizing auth state:',
        expect.any(Error)
      );
    });
  });
}); 