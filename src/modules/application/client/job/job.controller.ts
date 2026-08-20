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
import { ContentLength, JobCategory, JobStatus, Platform } from 'prisma/generated';
import { ClientJobPaginationDto } from './dto/pagination-job.dto';
import { memoryStorage } from 'multer';

@ApiTags('🏴 Client Job Management')
@ApiBearerAuth(USER_TYPES.CLIENT)
@ApiExtraModels(ClientCreateJobDto, ClientUpdateJobDto)
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /*----------------------------------------
          New Job Api Endpoints Start
  ----------------------------------------*/

  /*-------------------------------------------------------
      my jobs list (All/pending/completed/cancel/others)
  -------------------------------------------------------*/

  @Get('myjob-list')
  @ApiOperation({
    summary: 'Get my approved jobs ✪✪✪',
    description:
      'Returns the paginated list of jobs where the editor has an approved bid.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: JobStatus,
    description: 'Filter by status',
  })
  async myJobs(
    @Query() paginationDto: ClientJobPaginationDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.jobsService.myJobs(paginationDto, userId);
  }

  
  /*----------------------------------------
       Create A Job Start
  ----------------------------------------*/
  @Post()
  @ApiOperation({
    summary: 'Create a job ✪✪✪',
    description: 'Create a new client job with optional photo and document uploads.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Job creation payload',
    schema: {
      type: 'object',
      properties: {
        job_title: {
          type: 'string',
          example: 'Need a video editor for YouTube shorts',
        },
        job_description: {
          type: 'string',
          example: 'We need a professional editor for a short-form video campaign.',
        },
        job_category: {
          type: 'string',
          enum: Object.values(JobCategory),
          example: JobCategory.SHORTS_REELS_TIKTOKS,
        },
        job_skill: {
          type: 'string',
          example: 'Adobe Premiere Pro, After Effects',
        },
        job_budget: {
          type: 'number',
          example: 500,
          minimum: 1,
        },
        job_duration: {
          type: 'number',
          example: 7,
        },
        job_content_length: {
          type: 'string',
          enum: Object.values(ContentLength),
          example: ContentLength.MIN_5_10,
        },
        job_platform: {
          type: 'string',
          enum: Object.values(Platform),
          example: Platform.YOUTUBE,
        },
        job_photo: {
          type: 'string',
          format: 'binary',
        },
        style: {
          type: 'string',
          format: 'binary',
        },
        pdf: {
          type: 'string',
          format: 'binary',
        },
        doc: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'job_photo', maxCount: 1 },
        { name: 'style', maxCount: 1 },
        { name: 'pdf', maxCount: 1 },
        { name: 'doc', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: {
          fileSize: 50 * 1024 * 1024,
        },
      },
    ),
  )
  async createJob(
    @Req() req: any,
    @Body() dto: ClientCreateJobDto,
    @UploadedFiles()
    files: {
      job_photo?: Express.Multer.File[];
      style?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
      doc?: Express.Multer.File[];
    },
  ) {
    const userId = req.user?.userId;
    return this.jobsService.createJob(userId, dto, files );
  }

 
}
