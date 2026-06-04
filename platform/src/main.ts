import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS for production and development
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'https://smart-factory-yhz5-d3x1yu97c.vercel.app',
        'https://smart-factory-dashboard.vercel.app'
      ];

      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.trycloudflare.com')) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
