import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PostType {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  likeCount: number;

  @Field()
  dislikeCount: number;

  @Field()
  likedByUser: boolean;

  @Field()
  dislikedByUser: boolean;

  @Field(() => [ID])
  likerIds: string[];

  @Field(() => [ID], { nullable: true })
  dislikerIds?: string[];
}
