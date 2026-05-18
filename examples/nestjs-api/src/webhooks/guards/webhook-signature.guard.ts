import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const signature = request.headers['stripe-signature'];
    const value = Array.isArray(signature) ? signature[0] : signature;
    if (!value || !this.config.get<string>('stripeWebhookSecret')) {
      throw new UnauthorizedException('Stripe signature required');
    }
    return true;
  }
}
