import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../user/model/user.model';
import { Response } from 'express';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-id-1',
    email: 'test@example.com',
    password: 'hashed-password',
    salt: 'salt',
  };

  const mockJwtPayload = {
    sub: mockUser.id,
    email: mockUser.email,
  };

  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  beforeEach(async () => {
    // Create mock services
    const mockUserService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      jwtSecret: 'test-jwt-secret',
      jwtExpiresIn: '1h',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtRefreshExpiresIn: '7d',
      isProduction: false,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService) as jest.Mocked<UserService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Default mock implementations
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.sign.mockImplementation((payload, options) => {
      return options ? mockRefreshToken : mockAccessToken;
    });
    jwtService.verify.mockReturnValue(mockJwtPayload);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(
        'test@example.com',
        'password123'
      );

      expect(result).toEqual(mockUser);
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.validateUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com'
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateUser('test@example.com', 'wrong-password')
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-password',
        mockUser.password
      );
    });
  });

  describe('login', () => {
    it('should return user and tokens when login is successful', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should set cookies when response object is provided', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser);
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      // Act
      await authService.login('test@example.com', 'password123', mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should not set cookies when response object is not provided', async () => {
      // Arrange
      userService.findByEmail.mockResolvedValue(mockUser);
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      // Act
      await authService.login('test@example.com', 'password123');

      // Assert
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return a new access token when refresh token is valid', async () => {
      // Arrange
      userService.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await authService.refreshToken(mockRefreshToken);

      // Assert
      expect(result).toEqual({
        accessToken: mockAccessToken,
      });
      expect(jwtService.verify).toHaveBeenCalledWith(mockRefreshToken, {
        secret: configService.jwtRefreshSecret,
      });
      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should set cookies when response object is provided', async () => {
      // Arrange
      userService.findOne.mockResolvedValue(mockUser);
      const mockResponse = {
        cookie: jest.fn(),
      } as unknown as Response;

      // Act
      await authService.refreshToken(mockRefreshToken, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );

      expect(jwtService.verify).toHaveBeenCalledWith('invalid-token', {
        secret: configService.jwtRefreshSecret,
      });
      expect(userService.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      userService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        UnauthorizedException
      );

      expect(jwtService.verify).toHaveBeenCalled();
      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('logout', () => {
    it('should return success when logout is called without response', async () => {
      // Act
      const result = await authService.logout();

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should clear cookies when response object is provided', async () => {
      // Arrange
      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      // Act
      const result = await authService.logout(mockResponse);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
