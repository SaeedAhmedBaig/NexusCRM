require('reflect-metadata');
const dns = require('dns');
const { NestFactory } = require('@nestjs/core');
const { ConfigService } = require('@nestjs/config');
const { AppModule } = require('./app.module');
const { initSocketIO } = require('./realtime/socket-hub');

async function bootstrap() {
  if (process.env.DNS_SERVERS !== 'system') {
    const servers = (process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);
    if (servers.length) dns.setServers(servers);
  }

  const express = require('express');
  const app = await NestFactory.create(AppModule, { rawBody: true, bodyParser: false });
  const bodyLimit = process.env.REQUEST_BODY_LIMIT || '12mb';
  app.use('/api/billing/webhook', express.raw({ type: 'application/json', limit: bodyLimit }), (req, res, next) => {
    req.rawBody = req.body;
    next();
  });
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ limit: bodyLimit, extended: true }));
  app.setGlobalPrefix('api');

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
