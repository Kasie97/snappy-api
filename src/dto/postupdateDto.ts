import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PostUpdateDTO {
  @Field(() => ID)
  postId: string;

  @Field()
  likeCount: number;

  @Field()
  dislikeCount: number;
}
