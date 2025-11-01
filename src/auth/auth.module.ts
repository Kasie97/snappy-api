import { Module } from '@nestjs/common';
import { MockAuthGuard } from './mock-auth.guard';

@Module({
  providers: [MockAuthGuard],
  exports: [MockAuthGuard],
})
export class AuthModule {}
