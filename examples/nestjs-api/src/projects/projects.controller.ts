import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { PaginatedProjectResponseDto } from './dto/paginated-project-response.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({
    operationId: 'listProjects',
    summary: 'List projects',
    description:
      'Returns projects visible to the current account with filter metadata.',
  })
  @ApiOkResponse({
    description: 'Projects returned.',
    type: PaginatedProjectResponseDto,
  })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ProjectQueryDto,
  ): Promise<PaginatedProjectResponseDto> {
    return this.projects.list(user.accountId ?? 'default-account', query);
  }

  @Post()
  @ApiOperation({ operationId: 'createProject', summary: 'Create project' })
  @ApiCreatedResponse({
    description: 'Project created.',
    type: ProjectResponseDto,
  })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projects.create(
      user.accountId ?? 'default-account',
      user.id,
      dto,
    );
  }

  @Get(':projectId')
  @ApiOperation({ operationId: 'getProject', summary: 'Get project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ description: 'Project returned.', type: ProjectResponseDto })
  get(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
  ): Promise<ProjectResponseDto> {
    return this.projects.findOne(
      user.accountId ?? 'default-account',
      projectId,
    );
  }

  @Patch(':projectId')
  @ApiOperation({ operationId: 'updateProject', summary: 'Update project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ description: 'Project updated.', type: ProjectResponseDto })
  update(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projects.update(
      user.accountId ?? 'default-account',
      projectId,
      dto,
    );
  }

  @Post(':projectId/archive')
  @ApiOperation({ operationId: 'archiveProject', summary: 'Archive project' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ description: 'Project archived.', type: ProjectResponseDto })
  archive(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
  ): Promise<ProjectResponseDto> {
    return this.projects.archive(
      user.accountId ?? 'default-account',
      projectId,
    );
  }

  @Get(':projectId/export')
  @Header('content-type', 'text/csv')
  @ApiProduces('text/csv')
  @ApiOperation({
    operationId: 'exportProjectCsv',
    summary: 'Export project tasks',
  })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  exportCsv(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
  ): Promise<StreamableFile> {
    return this.projects.exportCsv(
      user.accountId ?? 'default-account',
      projectId,
    );
  }
}
