import { Schema, Document, Types } from 'mongoose';

export interface Post extends Document {
  content: string;
  author: Types.ObjectId; // reference to User
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = new Schema<Post>(
  {
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true },
);
PostSchema.index({ likes: 1 });
PostSchema.index({ dislikes: 1 });
