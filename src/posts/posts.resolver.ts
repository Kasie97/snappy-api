import {
  Args,
  Query,
  Resolver,
  Mutation,
  Subscription,
  ID,
} from '@nestjs/graphql';
import { PostType } from 'src/dto/postDto';
import { PostUpdateDTO } from 'src/dto/postupdateDto';
import { PostsService } from './posts.service';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Resolver(() => PostType)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => PostType)
  post(
    @Args('postId', { type: () => ID }) postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.getPostById(postId, user.id);
  }

  @Mutation(() => PostType)
  async createPost(
    @Args('content') content: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.createPost(content, user.id);
  }

  @Mutation(() => PostType)
  async likePost(
    @Args('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.likePost(postId, user.id);
  }

  @Mutation(() => PostType)
  async unlikePost(
    @Args('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.unlikePost(postId, user.id);
  }

  @Mutation(() => PostType)
  async dislikePost(
    @Args('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.dislikePost(postId, user.id);
  }

  @Mutation(() => PostType)
  async undislikePost(
    @Args('postId') postId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.undislikePost(postId, user.id);
  }

  /**
   * Dynamic post-specific subscription for scalable updates.
   */
  @Subscription(() => PostUpdateDTO, {
    // filter: (
    //   payload: { onPostUpdate: PostUpdateDTO },
    //   variables: { postId: string },
    // ) => payload.onPostUpdate.postId === variables.postId,
  })
  onPostUpdate(@Args('postId', { type: () => ID }) postId: string) {
    return this.postsService.getPubSub().asyncIterator(`postUpdated:${postId}`);
  }
}
