import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver, GqlContext } from './auth.resolver';
import { AuthService } from './auth.service';
import { User } from '../user/model/user.model';
import { REFRESH_TOKEN_COOKIE } from './config/cookie.config';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-id-1',
    email: 'test@example.com',
    password: 'hashed-password',
    salt: 'salt',
  };

  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  const mockAuthResult = {
    user: mockUser,
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
  };

  const mockRefreshTokenResult = {
    accessToken: mockAccessToken,
  };

  const mockLogoutResult = {
    success: true,
    message: 'Logged out successfully',
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;

    authService.login.mockResolvedValue(mockAuthResult);
    authService.refreshToken.mockResolvedValue(mockRefreshTokenResult);
    authService.logout.mockResolvedValue(mockLogoutResult);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const loginInput = { email: 'test@example.com', password: 'password123' };
      const context: GqlContext = {
        req: {} as any,
        res: {} as any,
      };

      const result = await resolver.login(loginInput, context);

      expect(result).toEqual(mockAuthResult);
      expect(authService.login).toHaveBeenCalledWith(
        loginInput.email,
        loginInput.password,
        context.res
      );
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with token from input', async () => {
      const refreshTokenInput = { refreshToken: mockRefreshToken };
      const context: GqlContext = {
        req: { cookies: {} } as any,
        res: {} as any,
      };

      const result = await resolver.refreshToken(refreshTokenInput, context);

      expect(result).toEqual(mockRefreshTokenResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        mockRefreshToken,
        context.res
      );
    });

    it('should call authService.refreshToken with token from cookie', async () => {
      const context: GqlContext = {
        req: {
          cookies: {
            [REFRESH_TOKEN_COOKIE]: mockRefreshToken,
          },
        } as any,
        res: {} as any,
      };

      const result = await resolver.refreshToken(undefined, context);

      expect(result).toEqual(mockRefreshTokenResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        mockRefreshToken,
        context.res
      );
    });

    it('should throw error when no token is provided', async () => {
      const context: GqlContext = {
        req: { cookies: {} } as any,
        res: {} as any,
      };

      await expect(resolver.refreshToken(undefined, context)).rejects.toThrow(
        'Refresh token is required'
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('should prioritize token from cookie over input', async () => {
      const cookieToken = 'cookie-token';
      const inputToken = 'input-token';
      const refreshTokenInput = { refreshToken: inputToken };
      const context: GqlContext = {
        req: {
          cookies: {
            [REFRESH_TOKEN_COOKIE]: cookieToken,
          },
        } as any,
        res: {} as any,
      };

      await resolver.refreshToken(refreshTokenInput, context);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        cookieToken,
        context.res
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout with response object', async () => {
      const context: GqlContext = {
        req: {} as any,
        res: {} as any,
      };

      const result = await resolver.logout(context);

      expect(result).toEqual(mockLogoutResult);
      expect(authService.logout).toHaveBeenCalledWith(context.res);
    });
  });
});
