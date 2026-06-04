import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const tunnelOrigins = (process.env.CORS_TUNNEL_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use((_, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Configure CORS for production and development
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'https://smart-factory-yhz5-d3x1yu97c.vercel.app',
        'https://smart-factory-dashboard.vercel.app',
        ...configuredOrigins,
      ];

      if (!origin || allowedOrigins.includes(origin) || tunnelOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'HEAD', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
