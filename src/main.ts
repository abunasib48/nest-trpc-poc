import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  // The React dev server is a different origin (localhost:5173) from this API
  // (localhost:3000), so the browser sends a CORS preflight before the tRPC
  // call. Without this the request is blocked in the browser (curl still works).
  app.enableCors({ origin: 'http://localhost:5173' });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
