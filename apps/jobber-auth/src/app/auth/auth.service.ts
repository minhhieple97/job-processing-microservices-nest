import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '../config/config.service';
import { User } from '../user/model/user.model';
import { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  createCookieOptions,
  parseJwtExpiresIn,
} from './config/cookie.config';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends TokenPair {
  user: User;
}

export interface LogoutResult {
  success: boolean;
  message: string;
}

export interface RefreshTokenResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(
    email: string,
    password: string,
    response?: Response
  ): Promise<AuthResult> {
    const user = await this.validateUser(email, password);
    const tokens = this.generateTokensForUser(user);

    if (response) {
      this.setTokenCookies(response, tokens.accessToken, tokens.refreshToken);
    }

    return {
      user,
      ...tokens,
    };
  }

  async refreshToken(
    token: string,
    response?: Response
  ): Promise<RefreshTokenResult> {
    try {
      const payload = this.verifyRefreshToken(token);
      const user = await this.getUserFromPayload(payload);
      const tokens = this.generateTokensForUser(user);

      if (response) {
        this.setTokenCookies(response, tokens.accessToken, tokens.refreshToken);
      }

      return {
        accessToken: tokens.accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(response?: Response): Promise<LogoutResult> {
    if (response) {
      this.clearTokenCookies(response);
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.jwtRefreshSecret,
    });
  }

  private async getUserFromPayload(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }

  private createPayloadFromUser(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
    };
  }

  private generateTokensForUser(user: User): TokenPair {
    const payload = this.createPayloadFromUser(user);

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.jwtRefreshSecret,
      expiresIn: this.configService.jwtRefreshExpiresIn,
    });
  }

  private setTokenCookies(
    response: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    const isProduction = this.configService.isProduction;

    const accessTokenExpires = parseJwtExpiresIn(
      this.configService.jwtExpiresIn
    );
    const refreshTokenExpires = parseJwtExpiresIn(
      this.configService.jwtRefreshExpiresIn
    );

    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      createCookieOptions(isProduction, accessTokenExpires)
    );

    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      createCookieOptions(isProduction, refreshTokenExpires)
    );
  }

  private clearTokenCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }
}
