import { Injectable } from '@nestjs/common';
import { User } from './model/user.model';

@Injectable()
export class UserService {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findOne(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async create(email: string): Promise<User> {
    const user = new User();
    user.id = Date.now().toString();
    user.email = email;

    this.users.push(user);
    return user;
  }
}
