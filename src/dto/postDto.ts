import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PostType {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  // @Field(() => UserDTO)
  // author: UserDTO;

  @Field()
  likeCount: number;

  @Field()
  dislikeCount: number;

  @Field()
  likedByUser: boolean;

  @Field()
  dislikedByUser: boolean;
}
