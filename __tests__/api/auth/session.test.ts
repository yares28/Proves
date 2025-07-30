import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/auth/session/route';

// Mock Next.js cookies
const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookies),
}));

// Mock NextResponse
const mockNextResponse = {
  json: jest.fn(),
  cookies: {
    set: jest.fn(),
  },
};

jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    headers: Map<string, string>;
    body: any;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.body = init?.body;
    }
    
    async json() {
      if (typeof this.body === 'string') {
        try {
          return JSON.parse(this.body);
        } catch {
          throw new Error('Invalid JSON');
        }
      }
      return {};
    }
  },
  NextResponse: {
    json: jest.fn((data, options) => ({
      ...mockNextResponse,
      ...options,
      json: () => data,
      status: options?.status || 200,
    })),
  },
}));

describe('Auth Session API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.get.mockReturnValue({ value: undefined });
    mockCookies.set.mockReturnValue(undefined);
  });

  describe('POST /api/auth/session', () => {
    it('should store session tokens successfully', async () => {
      // Given
      const sessionData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: 1234567890,
      };

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 400 when access_token is missing', async () => {
      // Given
      const sessionData = {
        refresh_token: 'test-refresh-token',
        expires_at: 1234567890,
      };

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing tokens');
    });

    it('should return 400 when refresh_token is missing', async () => {
      // Given
      const sessionData = {
        access_token: 'test-access-token',
        expires_at: 1234567890,
      };

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing tokens');
    });

    it('should handle malformed JSON in request body', async () => {
      // Given
      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to store session');
    });

    it('should handle empty request body', async () => {
      // Given
      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to store session');
    });

    it('should store session without expires_at when not provided', async () => {
      // Given
      const sessionData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      };

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/auth/session', () => {
    it('should return session when valid tokens exist', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: 'test-refresh-token' })
        .mockReturnValueOnce({ value: '1234567890' });

      // When
      const response = await GET();

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: 1234567890,
      });
    });

    it('should return null session when access token is missing', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: undefined })
        .mockReturnValueOnce({ value: 'test-refresh-token' });

      // When
      const response = await GET();

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session).toBeNull();
    });

    it('should return null session when refresh token is missing', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: undefined });

      // When
      const response = await GET();

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session).toBeNull();
    });

    it('should handle missing expires_at cookie', async () => {
      // Given
      mockCookies.get
        .mockReturnValueOnce({ value: 'test-access-token' })
        .mockReturnValueOnce({ value: 'test-refresh-token' })
        .mockReturnValueOnce({ value: undefined });

      // When
      const response = await GET();

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session).toEqual({
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
      const response = await GET();

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to retrieve session');
    });
  });

  describe('Cookie Security', () => {
    it('should set secure cookie options in production', async () => {
      // Given
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      const sessionData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: 1234567890,
      };

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // When
      await POST(request);

      // Then
      // Verify that secure cookie options are set
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'test-access-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
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

      const sessionData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_at: 1234567890,
      };

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      // When
      await POST(request);

      // Then
      // Verify that non-secure cookie options are set
      expect(mockNextResponse.cookies.set).toHaveBeenCalledWith(
        'sb-access-token',
        'test-access-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })
      );

      // Restore original environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      });
    });
  });
}); 