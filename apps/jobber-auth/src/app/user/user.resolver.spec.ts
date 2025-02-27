import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user-input.dto';
import { BadRequestException } from '@nestjs/common';

// Create a mock UserService
const mockUserService = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
};

describe('UserResolver', () => {
  let resolver: UserResolver;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: mockUserService,
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
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ];
      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await resolver.users();

      expect(result).toEqual(mockUsers);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', email: 'user@example.com' };
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

  describe('userByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = { id: '1', email: 'user@example.com' };
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
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserInput: CreateUserInput = {
        email: 'new@example.com',
        password: 'password123',
      };

      const mockCreatedUser = {
        id: '1',
        email: createUserInput.email,
        password: 'hashed-password',
        salt: 'some-salt',
      };

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
  });

  describe('edge cases', () => {
    it('should handle empty user list', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      const result = await resolver.users();

      expect(result).toEqual([]);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle null values in user data', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        password: 'hashed-password',
        salt: 'some-salt',
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.findOne.mockResolvedValue(mockUser);

      const result = await resolver.user('1');

      expect(result).toEqual(mockUser);
      expect(mockUserService.findOne).toHaveBeenCalledWith('1');
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test.special@example.com';
      const mockUser = {
        id: '1',
        email: specialEmail,
        password: 'hashed-password',
        salt: 'some-salt',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await resolver.userByEmail(specialEmail);

      expect(result).toEqual(mockUser);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(specialEmail);
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
  });
});
