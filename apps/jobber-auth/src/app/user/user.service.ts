import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './model/user.model';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user-input.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | undefined> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(createUserInput: CreateUserInput): Promise<User> {
    const { email, password } = createUserInput;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        salt,
      },
    });
  }
}
