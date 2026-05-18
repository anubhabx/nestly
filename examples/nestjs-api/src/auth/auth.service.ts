import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterUserDto): Promise<TokenPairDto> {
    const user = await this.usersService.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginUserDto): Promise<TokenPairDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !this.usersService.verifyPassword(user, dto.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPairDto> {
    const payload = await this.jwtService.verifyAsync<{ sub: string }>(
      dto.refreshToken,
    );
    const user = await this.usersService.findById(payload.sub);
    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.toProfile(user);
  }

  logout() {
    return { revoked: true };
  }

  private async issueTokens(user: User): Promise<TokenPairDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: 900 }),
      this.jwtService.signAsync(payload, { expiresIn: 60 * 60 * 24 * 7 }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: this.usersService.toProfile(user),
    };
  }
}
