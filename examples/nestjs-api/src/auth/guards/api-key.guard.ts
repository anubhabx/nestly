import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const header = request.headers['x-api-key'];
    const token = Array.isArray(header) ? header[0] : header;
    if (token !== this.config.get<string>('serviceApiKey')) {
      throw new UnauthorizedException('Valid X-API-Key header required');
    }
    return true;
  }
}
