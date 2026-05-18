import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { HealthModule } from '../src/health/health.module';

type HealthResponseBody = {
  status: string;
  dependencies: {
    database: string;
    redis: string;
  };
};

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as HealthResponseBody;

        expect(body.status).toBe('ok');
        expect(body.dependencies).toEqual({
          database: 'unchecked',
          redis: 'unchecked',
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
