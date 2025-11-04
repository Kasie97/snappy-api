import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { cookieMiddleware } from './utils/middleware/cookie.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieMiddleware);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
