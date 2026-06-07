require('@babel/register');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');
const { AuthService } = require('../src/modules/auth/auth.service');

async function test() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  const auth = app.get(AuthService);

  try {
    const result = await auth.signup({
      email: `debug${Date.now()}@example.com`,
      password: 'password123',
      companyName: 'Debug Co',
      subdomain: `debug${Date.now()}`,
      plan: 'free',
    });
    console.log('SUCCESS', JSON.stringify(result, null, 2).slice(0, 500));
  } catch (e) {
    console.error('FAILED');
    console.error(e);
  }

  await app.close();
  process.exit(0);
}

test();
