import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { UserProfileDto } from './dto/user-profile.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ operationId: 'registerUser', summary: 'Register user' })
  @ApiCreatedResponse({ description: 'User registered.', type: TokenPairDto })
  register(@Body() dto: RegisterUserDto): Promise<TokenPairDto> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ operationId: 'loginUser', summary: 'Login user' })
  @ApiOkResponse({ description: 'Token pair returned.', type: TokenPairDto })
  login(@Body() dto: LoginUserDto): Promise<TokenPairDto> {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ operationId: 'refreshToken', summary: 'Refresh token' })
  @ApiOkResponse({
    description: 'Fresh token pair returned.',
    type: TokenPairDto,
  })
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.auth.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ operationId: 'getCurrentUser', summary: 'Get current user' })
  @ApiOkResponse({
    description: 'Current user profile returned.',
    type: UserProfileDto,
  })
  me(@CurrentUser() user: RequestUser): Promise<UserProfileDto> {
    return this.auth.me(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ operationId: 'logoutUser', summary: 'Logout user' })
  @ApiOkResponse({ description: 'Token revocation accepted.' })
  logout() {
    return this.auth.logout();
  }
}
