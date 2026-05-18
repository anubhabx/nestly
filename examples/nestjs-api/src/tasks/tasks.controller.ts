import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskCommentResponseDto } from './dto/task-comment-response.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ operationId: 'listTasks', summary: 'List project tasks' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ description: 'Tasks returned.', type: [TaskResponseDto] })
  list(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Query() query: TaskQueryDto,
  ): Promise<TaskResponseDto[]> {
    return this.projects.listTasks(
      user.accountId ?? 'default-account',
      projectId,
      query,
    );
  }

  @Post()
  @ApiOperation({ operationId: 'createTask', summary: 'Create task' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Task created.', type: TaskResponseDto })
  create(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.projects.createTask(
      user.accountId ?? 'default-account',
      projectId,
      dto,
    );
  }

  @Get(':taskId')
  @ApiOperation({ operationId: 'getTask', summary: 'Get task' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiOkResponse({ description: 'Task returned.', type: TaskResponseDto })
  get(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<TaskResponseDto> {
    return this.projects.getTask(
      user.accountId ?? 'default-account',
      projectId,
      taskId,
    );
  }

  @Patch(':taskId')
  @ApiOperation({ operationId: 'updateTask', summary: 'Update task' })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiOkResponse({ description: 'Task updated.', type: TaskResponseDto })
  update(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.projects.updateTask(
      user.accountId ?? 'default-account',
      projectId,
      taskId,
      dto,
    );
  }

  @Post(':taskId/comments')
  @ApiOperation({
    operationId: 'createTaskComment',
    summary: 'Create task comment',
  })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiParam({ name: 'taskId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Comment created.',
    type: TaskCommentResponseDto,
  })
  addComment(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateTaskCommentDto,
  ): Promise<TaskCommentResponseDto> {
    return this.projects.addComment(
      user.accountId ?? 'default-account',
      projectId,
      taskId,
      user.id,
      dto,
    );
  }
}
