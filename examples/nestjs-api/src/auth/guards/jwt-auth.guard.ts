import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/decorators/current-user.decorator';

type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  accountId?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: RequestUser;
    }>();
    const authorization = request.headers.authorization;
    const token = Array.isArray(authorization)
      ? authorization[0]
      : authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new UnauthorizedException('Bearer token required');
    }

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    request.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      accountId: payload.accountId,
    };
    return true;
  }
}
