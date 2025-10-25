import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express'; // ✅ import this
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'https://virilocally-bearish-val.ngrok-free.dev/', 'http://localhost:5173', '*'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
  });

  // ✅ serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

   app.use((req, res, next) => {
    Logger.log(
      `Incoming request: ${req.method} ${req.path} | Origin: ${req.headers.origin}`,
      'CORS-DEBUG',
    );
    next();
  });


  await app.listen(process.env.PORT || 2701, '0.0.0.0');
}
bootstrap();
