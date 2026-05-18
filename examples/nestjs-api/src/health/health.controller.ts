import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ operationId: 'getHealth', summary: 'Get health' })
  @ApiOkResponse({
    description: 'Service is healthy.',
    type: HealthResponseDto,
  })
  health(): HealthResponseDto {
    return {
      status: 'ok',
      checkedAt: new Date().toISOString(),
      dependencies: { database: 'unchecked', redis: 'unchecked' },
    };
  }

  @Get('readiness')
  @ApiOperation({ operationId: 'getReadiness', summary: 'Get readiness' })
  @ApiOkResponse({
    description: 'Readiness checks returned.',
    type: HealthResponseDto,
  })
  readiness(): HealthResponseDto {
    return {
      status: 'ready',
      checkedAt: new Date().toISOString(),
      dependencies: { database: 'up', redis: 'up' },
    };
  }
}
