import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schemas/post.schema';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PostType } from 'src/dto/postDto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectModel('Post') private readonly postModel: Model<Post>,
    @Inject('PUB_SUB') private readonly pubSub: RedisPubSub,
  ) {}

  async createPost(content: string, authorId: string): Promise<PostType> {
    const newPost = await this.postModel.create({
      content,
      author: authorId,
      likes: [],
      dislikes: [],
    });

    return this.buildPostResponse(newPost, authorId);
  }

  /**
   * Handles liking a post.
   * - Throws if already liked.
   * - Removes from dislikes if user previously disliked.
   */
  async likePost(postId: string, userId: string): Promise<PostType> {
    const userObjectId = new Types.ObjectId(userId);
    const post = await this.postModel.findById(postId);

    if (!post) throw new NotFoundException('Post not found');

    const hasLiked = post.likes.some((id) => id.equals(userObjectId));
    const hasDisliked = post.dislikes.some((id) => id.equals(userObjectId));

    if (hasLiked) {
      throw new BadRequestException('This user already liked this post.');
    }

    // If disliked before, remove dislike and add like atomically
    const update: any = hasDisliked
      ? {
          $pull: { dislikes: userObjectId },
          $addToSet: { likes: userObjectId },
        }
      : { $addToSet: { likes: userObjectId } };

    const updatedPost = await this.postModel.findByIdAndUpdate(postId, update, {
      new: true,
    });

    if (!updatedPost) {
      throw new NotFoundException('Post not found after update');
    }

    await this.publishPostUpdate(updatedPost);

    return this.buildPostResponse(updatedPost as Post, userId);
  }

  /**
   * Handles unliking a post (removes like if user liked before).
   */
  async unlikePost(postId: string, userId: string): Promise<PostType> {
    const userObjectId = new Types.ObjectId(userId);
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const hasLiked = post.likes.some((id) => id.equals(userObjectId));
    if (!hasLiked) {
      throw new BadRequestException('Post is not liked by the user.');
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      postId,
      { $pull: { likes: userObjectId } },
      { new: true },
    );

    if (!updatedPost) {
      throw new NotFoundException('Post not found after update');
    }

    await this.publishPostUpdate(updatedPost);
    return this.buildPostResponse(updatedPost as Post, userId);
  }

  /**
   * Handles disliking a post.
   * - Throws if already disliked.
   * - Removes from likes if user previously liked.
   */
  async dislikePost(postId: string, userId: string): Promise<PostType> {
    const userObjectId = new Types.ObjectId(userId);
    const post = await this.postModel.findById(postId);

    if (!post) throw new NotFoundException('Post not found');

    const hasLiked = post.likes.some((id) => id.equals(userObjectId));
    const hasDisliked = post.dislikes.some((id) => id.equals(userObjectId));

    if (hasDisliked) {
      throw new BadRequestException('This user already disliked this post.');
    }

    const update: any = hasLiked
      ? {
          $pull: { likes: userObjectId },
          $addToSet: { dislikes: userObjectId },
        }
      : { $addToSet: { dislikes: userObjectId } };

    const updatedPost = await this.postModel.findByIdAndUpdate(postId, update, {
      new: true,
    });
    if (!updatedPost) {
      throw new NotFoundException('Post not found after update');
    }
    await this.publishPostUpdate(updatedPost);

    return this.buildPostResponse(updatedPost as Post, userId);
  }

  /**
   * Handles undisliking a post (removes dislike if exists).
   */
  async undislikePost(postId: string, userId: string): Promise<PostType> {
    const userObjectId = new Types.ObjectId(userId);
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const hasDisliked = post.dislikes.some((id) => id.equals(userObjectId));
    if (!hasDisliked) {
      throw new BadRequestException('Post is not disliked by the user.');
    }

    const updatedPost = await this.postModel.findByIdAndUpdate(
      postId,
      { $pull: { dislikes: userObjectId } },
      { new: true },
    );
    if (!updatedPost) {
      throw new NotFoundException('Post not found after update');
    }
    await this.publishPostUpdate(updatedPost);
    return this.buildPostResponse(updatedPost as Post, userId);
  }

  async getPostById(postId: string, userId: string): Promise<PostType> {
    const post = await this.postModel.findById(postId).populate('author');
    if (!post) throw new NotFoundException('Post not found');
    return this.buildPostResponse(post, userId);
  }

  /**
   * Builds a response object compatible with your GraphQL type.
   */
  private buildPostResponse(post: Post, userId: string): PostType {
    const likeCount = post.likes.length;
    const dislikeCount = post.dislikes.length;

    const likedByUser = post.likes.some(
      (l: Types.ObjectId) => l.toString() === userId,
    );
    const dislikedByUser = post.dislikes.some(
      (d: Types.ObjectId) => d.toString() === userId,
    );

    return {
      id: String(post._id),
      content: post.content,
      likeCount,
      dislikeCount,
      likedByUser,
      dislikedByUser,
    };
  }

  /**
   * Publishes updated counts to subscriptions.
   */
  private async publishPostUpdate(post: Post) {
    const payload = {
      onPostUpdate: {
        postId: String(post._id),
        likeCount: post.likes.length,
        dislikeCount: post.dislikes.length,
      },
    };
    await this.pubSub.publish(`postUpdated:${String(post._id)}`, payload);
    this.logger.log(
      `Published post update for post ${String(post._id)}: ${JSON.stringify(
        payload.onPostUpdate,
      )}`,
    );
  }

  getPubSub(): RedisPubSub {
    return this.pubSub;
  }
}
