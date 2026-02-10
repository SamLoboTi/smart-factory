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
      'https://smart-factory-api-kox6.onrender.com', // Render API
      'https://smart-factory-yhz5-c1j9bgolk.vercel.app', // Production frontend
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
