// src/app.resolver.ts
import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Resolver()
export class AdaResolver {
  constructor(@Inject('PUB_SUB') private readonly pubSub: RedisPubSub) {}

  @Query(() => String)
  hello() {
    return 'Hello from NestJS + GraphQL + Redis PubSub!';
  }

  @Mutation(() => Boolean)
  async triggerMessage(
    @Args('message', { type: () => String }) message: string,
  ) {
    await this.pubSub.publish('messageAdded', { messageAdded: message });
    return true;
  }

  @Subscription(() => String, {
    resolve: (payload: { messageAdded: string }) => payload.messageAdded,
  })
  messageAdded(): AsyncIterator<{ messageAdded: string }> {
    return this.pubSub.asyncIterator('messageAdded');
  }
}
