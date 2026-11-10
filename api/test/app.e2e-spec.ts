import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/database/prisma.service.js';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication<App>;
  let databaseUnavailable = false;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: async () => {
          if (databaseUnavailable) throw new Error('internal database detail');
          return [{ value: 1 }];
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  beforeEach(() => {
    databaseUnavailable = false;
  });

  it('reports API and database availability', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ data: { status: 'ok', database: 'ok' } });
  });

  it('returns 503 without exposing database details', async () => {
    databaseUnavailable = true;
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(503);
    expect(response.body).toMatchObject({
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Serviço temporariamente indisponível.',
    });
    expect(response.body.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
    expect(JSON.stringify(response.body)).not.toContain(
      'internal database detail',
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
