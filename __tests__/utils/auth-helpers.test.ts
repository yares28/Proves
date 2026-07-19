import {
  getCurrentSession,
  syncAuthState,
  getFreshAuthTokens,
  isAuthenticatedWithFreshTokens,
} from '@/utils/auth-helpers';

// auth-helpers calls createClient() at module load, so the mock has to be
// self-contained (a factory that references no outer variables) to avoid a
// temporal-dead-zone error. The jest.fn()s live inside the mocked module and are
// reached from the tests via jest.requireMock.
jest.mock('@/utils/supabase/client', () => {
  const getSession = jest.fn();
  const refreshSession = jest.fn();
  const client = { auth: { getSession, refreshSession } };
  return { createClient: () => client, __client: client };
});

const { __client } = jest.requireMock('@/utils/supabase/client') as {
  __client: { auth: { getSession: jest.Mock; refreshSession: jest.Mock } };
};

const { getSession, refreshSession } = __client.auth;

// expires_at is stored in seconds; the helper multiplies by 1000.
const nowSeconds = () => Math.floor(Date.now() / 1000);
const session = (overrides: Record<string, unknown> = {}) => ({
  access_token: 'access-123',
  refresh_token: 'refresh-456',
  expires_at: nowSeconds() + 3600, // an hour out → not expiring soon
  ...overrides,
});

describe('auth-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentSession', () => {
    it('returns the session when it is valid and not expiring soon', async () => {
      const s = session();
      getSession.mockResolvedValue({ data: { session: s }, error: null });

      await expect(getCurrentSession()).resolves.toEqual(s);
      expect(refreshSession).not.toHaveBeenCalled();
    });

    it('returns null when getSession reports an error', async () => {
      getSession.mockResolvedValue({ data: { session: null }, error: { message: 'boom' } });

      await expect(getCurrentSession()).resolves.toBeNull();
    });

    it('returns null when there is no session', async () => {
      getSession.mockResolvedValue({ data: { session: null }, error: null });

      await expect(getCurrentSession()).resolves.toBeNull();
    });

    it('refreshes and returns the new session when the token expires within 5 minutes', async () => {
      getSession.mockResolvedValue({
        data: { session: session({ expires_at: nowSeconds() + 60 }) },
        error: null,
      });
      const refreshed = session({ access_token: 'fresh-access' });
      refreshSession.mockResolvedValue({ data: { session: refreshed }, error: null });

      await expect(getCurrentSession()).resolves.toEqual(refreshed);
      expect(refreshSession).toHaveBeenCalledTimes(1);
    });

    it('returns null when the refresh fails', async () => {
      getSession.mockResolvedValue({
        data: { session: session({ expires_at: nowSeconds() + 60 }) },
        error: null,
      });
      refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'nope' } });

      await expect(getCurrentSession()).resolves.toBeNull();
    });

    it('returns null when getSession throws', async () => {
      getSession.mockRejectedValue(new Error('network'));

      await expect(getCurrentSession()).resolves.toBeNull();
    });
  });

  describe('syncAuthState', () => {
    it('resolves true when there is a valid session', async () => {
      getSession.mockResolvedValue({ data: { session: session() }, error: null });

      await expect(syncAuthState()).resolves.toBe(true);
    });

    it('resolves false when there is no session', async () => {
      getSession.mockResolvedValue({ data: { session: null }, error: null });

      await expect(syncAuthState()).resolves.toBe(false);
    });
  });

  describe('getFreshAuthTokens', () => {
    it('returns the access and refresh tokens from a valid session', async () => {
      getSession.mockResolvedValue({ data: { session: session() }, error: null });

      await expect(getFreshAuthTokens()).resolves.toEqual({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      });
    });

    it('returns null when there is no session', async () => {
      getSession.mockResolvedValue({ data: { session: null }, error: null });

      await expect(getFreshAuthTokens()).resolves.toBeNull();
    });

    it('returns null when the session is missing a token', async () => {
      getSession.mockResolvedValue({
        data: { session: session({ refresh_token: undefined }) },
        error: null,
      });

      await expect(getFreshAuthTokens()).resolves.toBeNull();
    });
  });

  describe('isAuthenticatedWithFreshTokens', () => {
    it('resolves true when the session has an access token', async () => {
      getSession.mockResolvedValue({ data: { session: session() }, error: null });

      await expect(isAuthenticatedWithFreshTokens()).resolves.toBe(true);
    });

    it('resolves false when there is no session', async () => {
      getSession.mockResolvedValue({ data: { session: null }, error: null });

      await expect(isAuthenticatedWithFreshTokens()).resolves.toBe(false);
    });
  });
});
