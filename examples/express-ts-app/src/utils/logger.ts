import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(({ level, message, timestamp, ...rest }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(rest, null, 2)}`;
  })
);

const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
];

// File transport for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
    })
  );
}

const loggerInstance = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  transports,
});

// Helper methods for consistent logging
export const logger = {
  error: (msg: string, meta?: object) => loggerInstance.error(msg, meta),
  warn: (msg: string, meta?: object) => loggerInstance.warn(msg, meta),
  info: (msg: string, meta?: object) => loggerInstance.info(msg, meta),
  http: (msg: string, meta?: object) => loggerInstance.http(msg, meta),
  debug: (msg: string, meta?: object) => loggerInstance.debug(msg, meta),
};
