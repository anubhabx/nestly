import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a public health payload', () => {
    const controller = new HealthController();

    expect(controller.health()).toMatchObject({
      status: 'ok',
      dependencies: {
        database: 'unchecked',
        redis: 'unchecked',
      },
    });
  });
});
