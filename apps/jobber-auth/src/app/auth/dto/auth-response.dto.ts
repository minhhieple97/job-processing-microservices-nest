import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/model/user.model';

@ObjectType()
export class AuthResponse {
  @Field(() => User)
  user: User;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

@ObjectType()
export class RefreshTokenResponse {
  @Field()
  accessToken: string;
}

@ObjectType()
export class LogoutResponse {
  @Field()
  success: boolean;
}
