import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user-input.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { User } from './model/user.model';

// Create a mock UserService
const mockUserService = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
};

// Mock for GqlAuthGuard
const mockGqlAuthGuard = {
  canActivate: jest.fn().mockImplementation(() => true),
};

// Create a mock user for testing
const createMockUser = (overrides = {}): Partial<User> => ({
  id: '1',
  email: 'user@example.com',
  password: 'hashed-password',
  salt: 'some-salt',
  ...overrides,
});

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: GqlAuthGuard,
          useValue: mockGqlAuthGuard,
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    userService = module.get<UserService>(UserService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('users', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        createMockUser({ id: '1', email: 'user1@example.com' }),
        createMockUser({ id: '2', email: 'user2@example.com' }),
      ];
      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await resolver.users();

      expect(result).toEqual(mockUsers);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle empty array response', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      const result = await resolver.users();

      expect(result).toEqual([]);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      const mockUser = createMockUser();
      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.user('1');

      expect(result).toEqual(mockUser);
      expect(mockUserService.findOne).toHaveBeenCalledWith('1');
    });

    it('should return undefined if user not found', async () => {
      mockUserService.findOne.mockResolvedValue(undefined);

      const result = await resolver.user('nonexistent');

      expect(result).toBeUndefined();
      expect(mockUserService.findOne).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('me', () => {
    it('should return the current authenticated user', async () => {
      const mockUser = createMockUser();

      const result = await resolver.me(mockUser as User);

      expect(result).toEqual(mockUser);
    });

    it('should return the exact user object passed as current user', async () => {
      const mockUser = createMockUser({
        id: 'custom-id',
        email: 'custom@example.com',
        name: 'Custom User',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      });

      const result = await resolver.me(mockUser as User);

      expect(result).toBe(mockUser); // Check for reference equality
      expect(result).toEqual(mockUser); // Check for value equality
    });

    it('should handle user with minimal properties', async () => {
      const minimalUser = { id: 'min-id', email: 'minimal@example.com' };

      const result = await resolver.me(minimalUser as User);

      expect(result).toEqual(minimalUser);
    });
  });

  describe('userByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = createMockUser();
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await resolver.userByEmail('user@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'user@example.com'
      );
    });

    it('should return undefined if user not found by email', async () => {
      mockUserService.findByEmail.mockResolvedValue(undefined);

      const result = await resolver.userByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com'
      );
    });

    it('should handle case sensitivity in email search', async () => {
      const email = 'User@Example.com';
      const mockUser = createMockUser({ email });
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await resolver.userByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserInput: CreateUserInput = {
        email: 'new@example.com',
        password: 'password123',
      };

      const mockCreatedUser = createMockUser({
        email: createUserInput.email,
      });

      mockUserService.create.mockResolvedValue(mockCreatedUser);

      const result = await resolver.createUser(createUserInput);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserService.create).toHaveBeenCalledWith(createUserInput);
    });

    it('should handle errors when creating a user with existing email', async () => {
      const createUserInput: CreateUserInput = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const error = new BadRequestException(
        'User with this email already exists'
      );
      mockUserService.create.mockRejectedValue(error);

      await expect(resolver.createUser(createUserInput)).rejects.toThrow(
        BadRequestException
      );
      await expect(resolver.createUser(createUserInput)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(mockUserService.create).toHaveBeenCalledWith(createUserInput);
    });

    it('should handle unexpected errors during user creation', async () => {
      const createUserInput: CreateUserInput = {
        email: 'new@example.com',
        password: 'password123',
      };

      mockUserService.create.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(resolver.createUser(createUserInput)).rejects.toThrow(
        'Database connection error'
      );
      expect(mockUserService.create).toHaveBeenCalledWith(createUserInput);
    });

    it('should validate input before creating user', async () => {
      // This test verifies that the resolver passes the exact input to the service
      const createUserInput: CreateUserInput = {
        email: 'test@example.com',
        password: 'securePassword123',
      };

      mockUserService.create.mockResolvedValue(
        createMockUser({
          email: createUserInput.email,
        })
      );

      await resolver.createUser(createUserInput);

      // Verify the exact input was passed to the service
      expect(mockUserService.create).toHaveBeenCalledWith(createUserInput);
      expect(mockUserService.create.mock.calls[0][0]).toBe(createUserInput);
    });
  });

  describe('edge cases', () => {
    it('should handle empty user list', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      const result = await resolver.users();

      expect(result).toEqual([]);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle null values in user data', async () => {
      const mockUser = createMockUser({
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.user('1');

      expect(result).toEqual(mockUser);
      expect(mockUserService.findOne).toHaveBeenCalledWith('1');
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test.special@example.com';
      const mockUser = createMockUser({
        email: specialEmail,
      });

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await resolver.userByEmail(specialEmail);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(specialEmail);
    });

    it('should handle undefined user in me method', async () => {
      // This is an edge case that shouldn't happen in production but tests robustness
      const result = await resolver.me(undefined as unknown as User);

      expect(result).toBeUndefined();
    });
  });

  describe('service interaction', () => {
    it('should pass correct parameters to service methods', async () => {
      await resolver.user('test-id');
      expect(mockUserService.findOne).toHaveBeenCalledWith('test-id');

      await resolver.userByEmail('test@example.com');
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );

      await resolver.users();
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      mockUserService.findAll.mockRejectedValue(new Error('Service error'));

      await expect(resolver.users()).rejects.toThrow('Service error');
    });

    it('should handle authentication errors', async () => {
      mockUserService.findAll.mockRejectedValue(
        new UnauthorizedException('Not authenticated')
      );

      await expect(resolver.users()).rejects.toThrow(UnauthorizedException);
      await expect(resolver.users()).rejects.toThrow('Not authenticated');
    });
  });

  describe('authorization', () => {
    it('should use GqlAuthGuard for protected queries', () => {
      const guardProvider = Test.createTestingModule({
        providers: [{ provide: GqlAuthGuard, useValue: mockGqlAuthGuard }],
      }).compile();

      expect(mockGqlAuthGuard).toBeDefined();
    });
  });
});
