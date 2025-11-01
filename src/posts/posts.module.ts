import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostSchema } from './schemas/post.schema';
import { PostsService } from './posts.service';
import { UsersModule } from '../users/users.module';
import { PostsResolver } from './posts.resolver';
import { PubSubModule } from 'src/pubsub/pubsub.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Post', schema: PostSchema }]),
    UsersModule,
    PubSubModule,
  ],
  providers: [PostsService, PostsResolver],
  exports: [PostsService],
})
export class PostsModule {}
