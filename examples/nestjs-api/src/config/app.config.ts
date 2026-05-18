export const appConfig = () => ({
  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5434),
    username: process.env.DATABASE_USER ?? 'specord',
    password: process.env.DATABASE_PASSWORD ?? 'specord',
    name: process.env.DATABASE_NAME ?? 'specord_benchmark',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'local-development-secret',
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
  },
  serviceApiKey: process.env.SERVICE_API_KEY ?? 'local-service-key',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_local',
});
