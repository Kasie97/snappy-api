import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'node:path';
import { RedisPubSub } from 'graphql-redis-subscriptions';

import { MockAuthGuard } from './auth/mock-auth.guard';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { PubSubModule } from './pubsub/pubsub.module';
import { AdaResolver } from './app.resolver';

type GQLUser = { id?: string; username?: string; email?: string };
type GQLRequest = { user?: GQLUser; headers?: Record<string, string> };

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    PubSubModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [PubSubModule],
      inject: ['PUB_SUB'],
      useFactory: (pubSub: RedisPubSub) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        debug: true,

        playground: {
          settings: {
            'request.credentials': 'include',
          },
        },

        // ✅ Allow CORS + credentials for same-origin requests
        cors: {
          origin: 'http://localhost:3000',
          credentials: true,
        },

        subscriptions: {
          'graphql-ws': {
            onConnect: (context: unknown) => {
              const ctx = context as {
                extra?: { request?: { headers?: Record<string, string> } };
              } | null;
              const headers = ctx?.extra?.request?.headers ?? {};
              const userId = headers['x-user-id'] || 'mock-user-id';
              const username = headers['x-username'] || 'mockuser';

              return {
                user: {
                  id: userId,
                  username,
                  email: `${username}@example.com`,
                },
              };
            },
          },
          'subscriptions-transport-ws': {
            onConnect: (connectionParams: Record<string, unknown>) => {
              const userId =
                typeof connectionParams['x-user-id'] === 'string'
                  ? connectionParams['x-user-id']
                  : 'mock-user-id';
              const username =
                typeof connectionParams['x-username'] === 'string'
                  ? connectionParams['x-username']
                  : 'mockuser';

              return {
                user: {
                  id: userId,
                  username,
                  email: `${username}@example.com`,
                },
              };
            },
          },
        },

        context: ({
          req,
          connection,
        }: {
          req?: GQLRequest;
          connection?: { context?: { user?: GQLUser } };
        }) => {
          if (connection?.context?.user) {
            const user = connection.context.user;
            return { req: { user, headers: {} }, pubSub };
          }
          return {
            req: req ?? {
              user: {
                id: 'anon',
                username: 'anonymous',
                email: 'anon@example.com',
              },
              headers: {},
            },
            pubSub,
          };
        },
      }),
    }),
    PostsModule,
    AuthModule,
  ],
  providers: [
    AdaResolver,
    {
      provide: APP_GUARD,
      useClass: MockAuthGuard,
    },
  ],
})
export class AppModule {}
