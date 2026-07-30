import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ClientCreateJobDto } from './dto/create-job.dto';
import { ClientUpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './job.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExcludeController,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { JobStatus } from 'prisma/generated';

@ApiTags('🏳️Client Job Management')
@ApiExcludeController()
@ApiBearerAuth(USER_TYPES.CLIENT)
@ApiExtraModels(ClientCreateJobDto, ClientUpdateJobDto)
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a job',
    description:
      'Create a job with one or more attachment files and an optional job photo.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ClientCreateJobDto) },
        {
          type: 'object',
          properties: {
            attachment: {
              type: 'array',
              items: { type: 'string', format: 'binary' },
              description: 'Attachment files (at least 1 required)',
            },
            job_photo: {
              type: 'string',
              format: 'binary',
              description: 'Optional job photo',
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request (validation error or missing attachments)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only clients can create jobs' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'attachment', maxCount: 10 },
      { name: 'job_photo', maxCount: 1 },
    ]),
  )
  async createJob(
    @Req() req: any,
    @Body() dto: ClientCreateJobDto,
    @UploadedFiles()
    files: {
      attachment?: Express.Multer.File[];
      job_photo?: Express.Multer.File[];
    },
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User id not found in request');

    const attachments = files?.attachment ?? [];
    const jobPhoto = files?.job_photo?.[0];

    if (!attachments.length) {
      throw new BadRequestException('At least one attachment file is required');
    }

    return this.jobsService.createJob(userId, dto, attachments, jobPhoto);
  }

  @Get('allJobsByUser')
  @ApiOperation({
    summary: 'Get all jobs for logged in user',
    description: 'Retrieve paginated list of jobs created by the authenticated client user.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search term for title or description' })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus, description: 'Filter jobs by status' })
  @ApiResponse({ status: 200, description: 'List of client jobs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAllJobs(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q = '',
    @Query('status') status?: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User id not found in request');
    return this.jobsService.getAllJobs({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
      status,
      userId,
    });
  }

  @Get('allPublicJobs')
  @ApiOperation({
    summary: 'Get all public jobs',
    description: 'Retrieve paginated list of all public jobs.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'List of public jobs retrieved successfully' })
  getAllPublicJobs(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q = '',
  ) {
    return this.jobsService.getAllPublicJobs({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
    });
  }

  @Get(':jobId')
  @ApiOperation({
    summary: 'Get single job by ID',
    description: 'Retrieve detail information for a single job by its ID.',
  })
  @ApiParam({ name: 'jobId', type: String, description: 'ID of the job' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  getSingleJob(@Param('jobId') jobId: string) {
    return this.jobsService.getSingleJob(jobId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update job',
    description: 'Update job details or status by job ID.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID of the job to update' })
  @ApiBody({ type: ClientUpdateJobDto })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  update(@Param('id') id: string, @Body() dto: ClientUpdateJobDto) {
    return this.jobsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete job',
    description: 'Soft delete a job by its ID.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID of the job to delete' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  delete(@Param('id') id: string) {
    return this.jobsService.softDelete(id);
  }
}
