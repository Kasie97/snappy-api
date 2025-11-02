import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UserSeeder implements OnModuleInit {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async onModuleInit() {
    const count = await this.userModel.estimatedDocumentCount();

    if (count > 0) {
      this.logger.log(
        `Users already exist in the codebase, skipping seeding (${count} found).`,
      );
      return;
    }

    const users: Partial<User>[] = [
      { username: 'pearl', email: 'pearl@example.com' },
      { username: 'devbot', email: 'devbot@example.com' },
      { username: 'testuser', email: 'test@example.com' },
    ];

    await this.userModel.insertMany(users);
    this.logger.log(`Seeded ${users.length} users into MongoDB.`);
  }
}
