require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ConfigService } = require('@nestjs/config');
const { AppModule } = require('./app.module');
const { initSocketIO } = require('./realtime/socket-hub');

async function bootstrap() {
  const express = require('express');
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
    req.rawBody = req.body;
    next();
  });

  const config = app.get(ConfigService);
  const jwtSecret = config.get('JWT_SECRET', 'dev-secret-change-me');
  initSocketIO(app.getHttpServer(), jwtSecret);

  const envOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || [];
  const frontendUrl = config.get('FRONTEND_URL');
  const appDomain = config.get('APP_DOMAIN', 'localhost');

  const allowedOrigins = [
    ...envOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    /^http:\/\/[\w-]+\.localhost:3000$/,
  ];

  if (frontendUrl) {
    allowedOrigins.push(frontendUrl.replace(/\/$/, ''));
  }

  if (appDomain && appDomain !== 'localhost') {
    const escaped = appDomain.replace(/\./g, '\\.');
    allowedOrigins.push(`https://${appDomain}`);
    allowedOrigins.push(`http://${appDomain}`);
    allowedOrigins.push(new RegExp(`^https:\\/\\/[\\w-]+\\.${escaped}$`));
    allowedOrigins.push(new RegExp(`^http:\\/\\/[\\w-]+\\.${escaped}$`));
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const { SuperadminBootstrapService } = require('./modules/auth/superadmin-bootstrap.service');
  await app.get(SuperadminBootstrapService).ensureSuperadmin();

  app.getHttpAdapter().get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
