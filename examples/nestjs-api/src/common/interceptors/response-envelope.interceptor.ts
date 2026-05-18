import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';

type Envelope<T> = {
  data: T;
  meta: {
    requestId?: string;
    timestamp: string;
  };
};

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<Envelope<unknown>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { requestId?: string }>();

    return next.handle().pipe(
      map(
        (data: unknown): Envelope<unknown> => ({
          data,
          meta: {
            requestId: request.requestId,
            timestamp: new Date().toISOString(),
          },
        }),
      ),
    );
  }
}
