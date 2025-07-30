import { POST } from '@/app/api/auth/logout/route';

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn(),
  cookies: {
    set: jest.fn(),
  },
};

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      ...mockNextResponse,
      ...options,
      json: () => data,
      status: options?.status || 200,
    })),
  },
}));

describe('Auth Logout API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully and clear all auth cookies', async () => {
      // When
      const response = await POST();

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify that all auth cookies are cleared
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        '',
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        })
      );

      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-refresh-token',
        '',
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        })
      );

      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-expires-at',
        '',
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        })
      );
    });

    it('should handle logout errors gracefully', async () => {
      // Given
      mockNextResponse.cookies.set.mockImplementation(() => {
        throw new Error('Cookie error');
      });

      // When
      const response = await POST();

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to logout');
    });

    it('should set secure cookie options in production', async () => {
      // Given
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      // When
      await POST();

      // Then
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        '',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        })
      );

      // Restore original environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should set non-secure cookie options in development', async () => {
      // Given
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });

      // When
      await POST();

      // Then
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        '',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        })
      );

      // Restore original environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });

    it('should clear exactly three auth cookies', async () => {
      // When
      await POST();

      // Then
      expect(mockNextResponse.cookies.set).toHaveBeenCalledTimes(3);
      
      const calls = mockNextResponse.cookies.set.mock.calls;
      const cookieNames = calls.map(call => call[0]);
      
      expect(cookieNames).toContain('sb-access-token');
      expect(cookieNames).toContain('sb-refresh-token');
      expect(cookieNames).toContain('sb-expires-at');
    });

    it('should set all cookies with immediate expiration', async () => {
      // When
      await POST();

      // Then
      const calls = mockNextResponse.cookies.set.mock.calls;
      
      calls.forEach(call => {
        const options = call[2];
        expect(options.maxAge).toBe(0);
        expect(options.httpOnly).toBe(true);
        expect(options.sameSite).toBe('lax');
        expect(options.path).toBe('/');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors during logout', async () => {
      // Given
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockNextResponse.cookies.set.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // When
      const response = await POST();

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to logout');
      expect(consoleSpy).toHaveBeenCalledWith('Error during logout:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle null/undefined errors gracefully', async () => {
      // Given
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockNextResponse.cookies.set.mockImplementation(() => {
        throw null;
      });

      // When
      const response = await POST();

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to logout');

      consoleSpy.mockRestore();
    });
  });

  describe('Cookie Security', () => {
    it('should maintain consistent cookie options across all auth cookies', async () => {
      // When
      await POST();

      // Then
      const calls = mockNextResponse.cookies.set.mock.calls;
      const expectedOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      };

      calls.forEach(call => {
        const options = call[2];
        expect(options).toMatchObject(expectedOptions);
      });
    });

    it('should handle different NODE_ENV values correctly', async () => {
      // Test production environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });
      jest.clearAllMocks();
      await POST();
      
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        '',
        expect.objectContaining({ secure: true })
      );

      // Test development environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });
      jest.clearAllMocks();
      await POST();
      
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        '',
        expect.objectContaining({ secure: false })
      );

      // Test test environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
      });
      jest.clearAllMocks();
      await POST();
      
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        '',
        expect.objectContaining({ secure: false })
      );
    });
  });
}); 