import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ApolloDriver } from '@nestjs/apollo';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      useGlobalPrefix: true,
      playground: {
        settings: {
          'request.credentials': 'include',
        },
      },
      context: ({ req, res }) => ({ req, res }),
      autoSchemaFile: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
