import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from './app/config/config.service';
import cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { protobufPackage } from 'proto-types/proto/auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: protobufPackage,
      protoPath: join(__dirname, 'proto/auth.proto'),
      url: `0.0.0.0:${configService.grpcPort}`,
    },
  });

  app.setGlobalPrefix(globalPrefix);
  app.use(cookieParser());

  app.enableCors({
    origin: configService.isProduction
      ? configService.clientOrigin
      : ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Start both HTTP and gRPC servers
  await app.startAllMicroservices();
  const port = configService.port;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`🚀 gRPC Server is running on: 0.0.0.0:${configService.grpcPort}`);
}

bootstrap();
