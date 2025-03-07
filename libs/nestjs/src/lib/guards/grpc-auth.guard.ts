import {
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
} from 'proto-types/proto/auth';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';

import { catchError, firstValueFrom, throwError } from 'rxjs';
import { ClientGrpc } from '@nestjs/microservices';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GrpcAuthGuard implements CanActivate, OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject(AUTH_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const user = await firstValueFrom(
        this.authService.authenticate({ token }).pipe(
          catchError(() => {
            return throwError(() => new UnauthorizedException('Invalid token'));
          })
        )
      );
      req.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractToken(req: any): string | null {
    if (req.cookies) {
      return req.cookies.access_token;
    }
    const authHeader = req.headers.authorization;
    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      return authHeader.substring(7);
    }
    return null;
  }
}
