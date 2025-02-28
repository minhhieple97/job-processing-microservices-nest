import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  AuthService,
  AuthResult,
  LogoutResult,
  RefreshTokenResult,
} from './auth.service';
import { LoginInput } from './dto/login-input.dto';
import {
  AuthResponse,
  LogoutResponse,
  RefreshTokenResponse,
} from './dto/auth-response.dto';
import { RefreshTokenInput } from './dto/refresh-token-input.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { REFRESH_TOKEN_COOKIE } from './config/cookie.config';
import { Request, Response } from 'express';

export interface GqlContext {
  req: Request;
  res: Response;
}

/**
 * GraphQL resolver for authentication operations
 */
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(
    @Args('input') loginInput: LoginInput,
    @Context() context: GqlContext
  ): Promise<AuthResult> {
    const { email, password } = loginInput;
    return this.authService.login(email, password, context.res);
  }

  @Mutation(() => RefreshTokenResponse)
  async refreshToken(
    @Args('input', { nullable: true }) refreshTokenInput?: RefreshTokenInput,
    @Context() context?: GqlContext
  ): Promise<RefreshTokenResult> {
    const token = this.extractRefreshToken(context, refreshTokenInput);

    if (!token) {
      throw new Error('Refresh token is required');
    }

    return this.authService.refreshToken(token, context.res);
  }

  @Mutation(() => LogoutResponse)
  @UseGuards(GqlAuthGuard)
  async logout(@Context() context: GqlContext): Promise<LogoutResult> {
    return this.authService.logout(context.res);
  }

  private extractRefreshToken(
    context?: GqlContext,
    refreshTokenInput?: RefreshTokenInput
  ): string | undefined {
    const tokenFromCookie = context?.req?.cookies?.[REFRESH_TOKEN_COOKIE];
    const tokenFromInput = refreshTokenInput?.refreshToken;

    return tokenFromCookie || tokenFromInput;
  }
}
