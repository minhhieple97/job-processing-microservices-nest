import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './model/user.model';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user-input.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async user(@Args('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Query(() => User, { nullable: true, name: 'userByEmail' })
  async userByEmail(@Args('email') email: string): Promise<User | undefined> {
    return this.userService.findByEmail(email);
  }

  @Mutation(() => User)
  async createUser(
    @Args('input') createUserInput: CreateUserInput
  ): Promise<User> {
    return this.userService.create(createUserInput);
  }
}
