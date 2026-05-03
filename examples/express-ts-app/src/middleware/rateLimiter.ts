import { RateLimiterMemory } from 'rate-limiter-flexible';

// Login attempts limiter - 5 attempts per 15 minutes
export const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900, // 15 minutes
});

// SMS verification limiter - 3 attempts per hour
export const smsLimiter = new RateLimiterMemory({
  points: 3,
  duration: 3600, // 1 hour
});

// Email verification limiter - 10 attempts per day
export const emailVerificationLimiter = new RateLimiterMemory({
  points: 10,
  duration: 86400, // 24 hours
});
