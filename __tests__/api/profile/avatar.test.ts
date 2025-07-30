import { NextRequest } from 'next/server';
import { POST } from '@/app/api/profile/avatar/route';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
    })),
  },
};

jest.mock('@/lib/supabase/server', () => ({
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
    
    async formData() {
      return {
        get: jest.fn((key: string) => {
          if (key === 'avatar') {
            return {
              type: 'image/jpeg',
              size: 1024,
              name: 'avatar.jpg',
              arrayBuffer: jest.fn(() => new ArrayBuffer(1024)),
            };
          }
          return null;
        }),
      };
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

describe('Profile Avatar API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/profile/avatar', () => {
    it('should upload avatar successfully', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.storage.from().upload.mockResolvedValue({ data: { path: 'avatars/user-123-1234567890.jpg' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Given
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } });

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when no file is provided', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // Mock formData to return no avatar
      const mockFormData = {
        get: jest.fn(() => null),
      };
      jest.spyOn(request, 'formData').mockResolvedValue(mockFormData as any);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('No file provided');
    });

    it('should return 400 when file type is invalid', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // Mock formData to return invalid file type
      const mockFormData = {
        get: jest.fn(() => ({
          type: 'text/plain',
          size: 1024,
          name: 'document.txt',
          arrayBuffer: jest.fn(() => new ArrayBuffer(1024)),
        })),
      };
      jest.spyOn(request, 'formData').mockResolvedValue(mockFormData as any);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid file type');
    });

    it('should return 400 when file is too large', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // Mock formData to return large file
      const mockFormData = {
        get: jest.fn(() => ({
          type: 'image/jpeg',
          size: 10 * 1024 * 1024, // 10MB
          name: 'large-avatar.jpg',
          arrayBuffer: jest.fn(() => new ArrayBuffer(10 * 1024 * 1024)),
        })),
      };
      jest.spyOn(request, 'formData').mockResolvedValue(mockFormData as any);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('File too large');
    });

    it('should return 500 when upload fails', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.storage.from().upload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Upload failed');
    });

    it('should return 500 when auth error occurs', async () => {
      // Given
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Auth error'));

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Upload failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Given
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabase.storage.from().upload.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/profile/avatar', {
        method: 'POST',
      });

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Upload failed');
    });
  });
}); 