import { getCurrentSession, syncAuthState, getFreshAuthTokens, isAuthenticatedWithFreshTokens } from '@/utils/auth-helpers';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    refreshSession: jest.fn(),
  },
};

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock Next.js cookies
const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies),
}));

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentSession', () => {
    it('should return session when valid tokens exist', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: 'test-refresh-token' })
        .mockReturnValueOnce({ value: '1234567890' });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: 1234567890,
      });
    });

    it('should return null when access token is missing', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: undefined })
        .mockReturnValueOnce({ value: 'test-refresh-token' });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toBeNull();
    });

    it('should return null when refresh token is missing', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: undefined });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toBeNull();
    });

    it('should handle missing expires_at cookie', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: 'test-refresh-token' })
        .mockReturnValueOnce({ value: undefined });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: null,
      });
    });

    it('should handle cookies error gracefully', async () => {
      // Given
      mockCookies.get.mockImplementation(() => {
        throw new Error('Cookies error');
      });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toBeNull();
    });

    it('should handle null cookie values', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: null })
        .mockReturnValueOnce({ value: 'test-refresh-token' });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toBeNull();
    });

    it('should handle empty string cookie values', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: '' })
        .mockReturnValueOnce({ value: 'test-refresh-token' });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toBeNull();
    });

    it('should handle malformed expires_at value', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: 'test-refresh-token' })
        .mockReturnValueOnce({ value: 'invalid-number' });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: null,
      });
    });

    it('should handle negative expires_at value', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: 'test-refresh-token' })
        .mockReturnValueOnce({ value: '-1234567890' });

      // When
      const session = await getCurrentSession();

      // Then
      expect(session).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: -1234567890,
      });
    });
  });

  describe('syncAuthState', () => {
    it('should sync auth state successfully', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      // When
      const result = await syncAuthState();

      // Then
      expect(result).toBe(true);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it('should handle auth error gracefully', async () => {
      // Given
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

      // When
      const result = await syncAuthState();

      // Then
      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      // Given
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      // When
      const result = await syncAuthState();

      // Then
      expect(result).toBe(false);
    });

    it('should handle timeout errors', async () => {
      // Given
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Timeout'));

      // When
      const result = await syncAuthState();

      // Then
      expect(result).toBe(false);
    });

    it('should handle null user data', async () => {
      // Given
      mockSupabase.auth.getUser.mockResolvedValue({ data: null, error: null });

      // When
      const result = await syncAuthState();

      // Then
      expect(result).toBe(false);
    });

    it('should handle undefined user data', async () => {
      // Given
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: undefined }, error: null });

      // When
      const result = await syncAuthState();

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getFreshAuthTokens', () => {
    it('should return fresh tokens when session is valid', async () => {
      // Given
      const mockSession = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000, // 1 hour from now
      };
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toEqual(mockSession);
    });

    it('should refresh tokens when session is expired', async () => {
      // Given
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000, // 1 hour ago
      };
      const freshSession = {
        access_token: 'fresh-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
      };
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: expiredSession }, error: null });
      mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: freshSession }, error: null });

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toEqual(freshSession);
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
    });

    it('should return null when no session exists', async () => {
      // Given
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toBeNull();
    });

    it('should handle refresh errors gracefully', async () => {
      // Given
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
      };
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: expiredSession }, error: null });
      mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'Refresh failed' } });

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toBeNull();
    });

    it('should handle session with null expires_at', async () => {
      // Given
      const sessionWithoutExpiry = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: null,
      };
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: sessionWithoutExpiry }, error: null });

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toEqual(sessionWithoutExpiry);
    });

    it('should handle session with undefined expires_at', async () => {
      // Given
      const sessionWithoutExpiry = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: undefined,
      };
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: sessionWithoutExpiry }, error: null });

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toEqual(sessionWithoutExpiry);
    });

    it('should handle session with zero expires_at', async () => {
      // Given
      const sessionWithZeroExpiry = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: 0,
      };
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: sessionWithZeroExpiry }, error: null });

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toEqual(sessionWithZeroExpiry);
    });

    it('should handle network errors during refresh', async () => {
      // Given
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
      };
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: expiredSession }, error: null });
      mockSupabase.auth.refreshSession.mockRejectedValue(new Error('Network error'));

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toBeNull();
    });

    it('should handle timeout errors during refresh', async () => {
      // Given
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
      };
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: expiredSession }, error: null });
      mockSupabase.auth.refreshSession.mockRejectedValue(new Error('Timeout'));

      // When
      const tokens = await getFreshAuthTokens();

      // Then
      expect(tokens).toBeNull();
    });
  });

  describe('isAuthenticatedWithFreshTokens', () => {
    it('should return true when user has valid tokens', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
      };
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      // Given
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });

    it('should return false when session is expired and refresh fails', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 3600000,
      };
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: expiredSession }, error: null });
      mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'Refresh failed' } });

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      // Given
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });

    it('should return false when user exists but no session', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });

    it('should return false when session exists but no user', async () => {
      // Given
      const mockSession = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: Date.now() + 3600000,
      };
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });

    it('should handle auth errors from getUser', async () => {
      // Given
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });

    it('should handle auth errors from getSession', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: { message: 'Session error' } });

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });

    it('should handle timeout errors', async () => {
      // Given
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Timeout'));

      // When
      const isAuthenticated = await isAuthenticatedWithFreshTokens();

      // Then
      expect(isAuthenticated).toBe(false);
    });
  });
}); 