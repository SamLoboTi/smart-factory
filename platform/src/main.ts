import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS for production and development
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://smart-factory.vercel.app',
      'https://*.vercel.app', // Allow all Vercel preview deployments
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
