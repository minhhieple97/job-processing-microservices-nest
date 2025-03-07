import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>('PORT');
  }

  get databaseUrl(): string {
    return this.configService.get<string>('AUTH_DATABASE_URL');
  }

  get pulsarUrl(): string {
    return this.configService.get<string>('PULSAR_URL');
  }

  get pulsarAdminUrl(): string {
    return this.configService.get<string>('PULSAR_ADMIN_URL');
  }

  get pulsarTenant(): string {
    return this.configService.get<string>('PULSAR_TENANT');
  }

  get pulsarNamespace(): string {
    return this.configService.get<string>('PULSAR_NAMESPACE');
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN');
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
  }

  get cookieSecret(): string {
    return this.configService.get<string>('COOKIE_SECRET') || this.jwtSecret;
  }

  get clientOrigin(): string {
    return (
      this.configService.get<string>('CLIENT_ORIGIN') || 'http://localhost:4200'
    );
  }

  get grpcPort(): number {
    return this.configService.get<number>('GRPC_PORT') || 5000;
  }
}
