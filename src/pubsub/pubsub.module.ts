// src/pubsub/pubsub.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'PUB_SUB',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host =
          config.get<string>('REDIS_HOST') ||
          process.env.REDIS_HOST ||
          'localhost';
        const port =
          config.get<number>('REDIS_PORT') ||
          parseInt(process.env.REDIS_PORT || '6379', 10);

        const options = {
          host,
          port,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
          enableReadyCheck: true,
        };

        const publisher = new Redis(options);
        const subscriber = new Redis(options);

        const pubSub = new RedisPubSub({
          publisher,
          subscriber,
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log(`Redis PubSub is connected on ${host}:${port}`);
        }

        return pubSub;
      },
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule {}
