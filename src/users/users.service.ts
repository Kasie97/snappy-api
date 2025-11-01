import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  /**
   * Find all users (for dev or seeding verification)
   */
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  /**
   * Get a single user by ID
   */
  async findById(id: string | Types.ObjectId): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Get a single user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  /**
   * Pick a random user (useful for MockAuthGuard)
   */
  async getRandomUser(): Promise<User | null> {
    const count = await this.userModel.estimatedDocumentCount();
    if (count === 0) return null;

    const random = Math.floor(Math.random() * count);
    const user = await this.userModel.findOne().skip(random).exec();
    return user;
  }

  /**
   * Create a new user manually (for tests or migrations)
   */
  async createUser(data: Partial<User>): Promise<User> {
    const user = new this.userModel(data);
    return user.save();
  }

  /**
   * Utility for clearing users in dev/test environments
   */
  async clearAll(): Promise<void> {
    await this.userModel.deleteMany({});
    this.logger.warn('🧹 Cleared all users (dev/test only).');
  }
}
