import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './model/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | undefined> {
    return this.userService.findOne(id);
  }

  @Query(() => User, { nullable: true })
  async userByEmail(@Args('email') email: string): Promise<User | undefined> {
    return this.userService.findByEmail(email);
  }

  @Mutation(() => User)
  async createUser(@Args('email') email: string): Promise<User> {
    return this.userService.create(email);
  }
}
