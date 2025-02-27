import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './model/user.model';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user-input.dto';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Query(() => User, { nullable: true, name: 'user' })
  async user(@Args('id') id: string): Promise<User | undefined> {
    return this.userService.findOne(id);
  }

  @Query(() => User, { nullable: true, name: 'userByEmail' })
  async userByEmail(@Args('email') email: string): Promise<User | undefined> {
    return this.userService.findByEmail(email);
  }

  @Mutation(() => User, { name: 'createUser' })
  async createUser(
    @Args('createUserInput')
    createUserInput: CreateUserInput
  ): Promise<User> {
    return this.userService.create(createUserInput);
  }
}
