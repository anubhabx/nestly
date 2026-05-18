import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { PaginatedProjectResponseDto } from './dto/paginated-project-response.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/task-comment.entity';
import { CreateTaskCommentDto } from '../tasks/dto/create-task-comment.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { TaskCommentResponseDto } from '../tasks/dto/task-comment-response.dto';
import { TaskQueryDto } from '../tasks/dto/task-query.dto';
import { TaskResponseDto } from '../tasks/dto/task-response.dto';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    @InjectRepository(TaskComment)
    private readonly comments: Repository<TaskComment>,
  ) {}

  async list(
    accountId: string,
    query: ProjectQueryDto,
  ): Promise<PaginatedProjectResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const builder = this.projects
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.tasks', 'task')
      .where('project.accountId = :accountId', { accountId })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('project.createdAt', 'DESC');

    if (query.status) {
      builder.andWhere('project.status = :status', { status: query.status });
    }
    if (query.ownerId) {
      builder.andWhere('project.ownerId = :ownerId', {
        ownerId: query.ownerId,
      });
    }
    if (query.search) {
      builder.andWhere('project.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }
    if (query.tag) {
      builder.andWhere(':tag = ANY(project.tags)', { tag: query.tag });
    }

    const [items, total] = await builder.getManyAndCount();
    return {
      items: items.map((project) => this.toProjectResponse(project)),
      meta: { page, limit, total },
    };
  }

  async create(
    accountId: string,
    ownerId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = this.projects.create({
      ...dto,
      accountId,
      ownerId,
      status: dto.status ?? ProjectStatus.Planning,
      tags: dto.tags ?? [],
      metadata: dto.metadata ?? {},
    });
    return this.toProjectResponse(await this.projects.save(project));
  }

  async findOne(
    accountId: string,
    projectId: string,
  ): Promise<ProjectResponseDto> {
    return this.toProjectResponse(await this.getProject(accountId, projectId));
  }

  async update(
    accountId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.getProject(accountId, projectId);
    Object.assign(project, dto);
    return this.toProjectResponse(await this.projects.save(project));
  }

  async archive(
    accountId: string,
    projectId: string,
  ): Promise<ProjectResponseDto> {
    await this.projects.update(
      { accountId, id: projectId },
      { status: ProjectStatus.Archived },
    );
    return this.findOne(accountId, projectId);
  }

  async exportCsv(
    accountId: string,
    projectId: string,
  ): Promise<StreamableFile> {
    const project = await this.getProject(accountId, projectId);
    const csv = [
      'id,title,status,priority',
      ...(project.tasks ?? []).map(
        (task) => `${task.id},"${task.title}",${task.status},${task.priority}`,
      ),
    ].join('\n');
    return new StreamableFile(Readable.from([csv]), {
      type: 'text/csv',
      disposition: `attachment; filename="${project.slug}-tasks.csv"`,
    });
  }

  async listTasks(
    accountId: string,
    projectId: string,
    query: TaskQueryDto,
  ): Promise<TaskResponseDto[]> {
    await this.getProject(accountId, projectId);
    const builder = this.tasks
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.comments', 'comment')
      .where('task.projectId = :projectId', { projectId })
      .orderBy('task.createdAt', 'DESC');
    if (query.status)
      builder.andWhere('task.status = :status', { status: query.status });
    if (query.priority)
      builder.andWhere('task.priority = :priority', {
        priority: query.priority,
      });
    if (query.assigneeId) {
      builder.andWhere('task.assigneeId = :assigneeId', {
        assigneeId: query.assigneeId,
      });
    }
    if (query.label)
      builder.andWhere(':label = ANY(task.labels)', { label: query.label });
    return (await builder.getMany()).map((task) => this.toTaskResponse(task));
  }

  async createTask(
    accountId: string,
    projectId: string,
    dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    await this.getProject(accountId, projectId);
    const task = this.tasks.create({
      ...dto,
      projectId,
      labels: dto.labels ?? [],
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });
    return this.toTaskResponse(await this.tasks.save(task));
  }

  async getTask(
    accountId: string,
    projectId: string,
    taskId: string,
  ): Promise<TaskResponseDto> {
    await this.getProject(accountId, projectId);
    const task = await this.tasks.findOne({
      where: { id: taskId, projectId },
      relations: { comments: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return this.toTaskResponse(task);
  }

  async updateTask(
    accountId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    await this.getProject(accountId, projectId);
    const task = await this.tasks.findOne({ where: { id: taskId, projectId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    Object.assign(task, dto);
    task.dueAt = dto.dueAt ? new Date(dto.dueAt) : task.dueAt;
    return this.toTaskResponse(await this.tasks.save(task));
  }

  async addComment(
    accountId: string,
    projectId: string,
    taskId: string,
    authorId: string,
    dto: CreateTaskCommentDto,
  ): Promise<TaskCommentResponseDto> {
    await this.getTask(accountId, projectId, taskId);
    const comment = this.comments.create({
      taskId,
      authorId,
      body: dto.body,
      metadata: dto.metadata ?? {},
    });
    return this.toCommentResponse(await this.comments.save(comment));
  }

  private async getProject(
    accountId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.projects.findOne({
      where: { accountId, id: projectId },
      relations: { tasks: { comments: true } },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private toProjectResponse(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      accountId: project.accountId,
      ownerId: project.ownerId,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      tags: project.tags,
      metadata: project.metadata,
      createdAt: project.createdAt.toISOString(),
      tasks: project.tasks?.map((task) => this.toTaskResponse(task)),
    };
  }

  private toTaskResponse(task: Task): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt?.toISOString(),
      labels: task.labels,
      comments: task.comments?.map((comment) =>
        this.toCommentResponse(comment),
      ),
      createdAt: task.createdAt.toISOString(),
    };
  }

  private toCommentResponse(comment: TaskComment): TaskCommentResponseDto {
    return {
      id: comment.id,
      authorId: comment.authorId,
      body: comment.body,
      metadata: comment.metadata,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
