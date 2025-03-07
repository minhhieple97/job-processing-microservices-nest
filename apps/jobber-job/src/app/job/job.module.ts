import { AUTH_PACKAGE_NAME } from 'proto-types/proto/auth';
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { FibonacciJob } from './fibonacci.job';
import { JobResolver } from './job.resolver';
import { JobService } from './job.service';
import { ConfigService } from '../config/config.service';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    ConfigModule,
    DiscoveryModule,
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: AUTH_PACKAGE_NAME,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.authServiceUrl,
            package: AUTH_PACKAGE_NAME,
            protoPath: join(process.cwd(), 'proto/auth.proto'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [FibonacciJob, JobResolver, JobService],
})
export class JobModule {}
