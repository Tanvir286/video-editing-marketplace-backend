import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { EditorJobPaginationDto } from './dto/pagination-job.dto';
import { JobStatus } from 'prisma/generated';

@ApiTags('🏳️Editor Job Management')
@ApiBearerAuth(USER_TYPES.EDITOR)
@UseGuards(JwtAuthGuard)
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  /*--------------------------------------------------
      My Jobs  (All/pending/completed/cancel/others)
  --------------------------------------------------*/
  @Get('my-jobs')
  @ApiOperation({
    summary: 'Get my approved jobs 🔯🔯🔯',
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
  description: 'Filter by status'
})
  async myJobs(
    @Query() paginationDto: EditorJobPaginationDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.jobService.myJobs(paginationDto, userId);
  }

  /*--------------------------------------------------
              get quick match result
  --------------------------------------------------*/
  @Get('quick-match')
  @ApiOperation({
    summary: 'Get quick match pending jobs 🔯🔯🔯',
    description:
      'Returns the paginated list of jobs that are still in PENDING status for the editor dashboard.',
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
  async quickMatch(
    @Query() paginationDto: PaginationDto, 
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.jobService.quickMatch(paginationDto, userId);
  }

  /*--------------------------------------------------
              browse jobs
  --------------------------------------------------*/
  @Get('browse-jobs')
  @ApiOperation({
    summary: 'Browse pending jobs 🔯🔯🔯',
    description:
      'Returns the paginated browse list of all pending jobs for the editor dashboard.',
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
  async browseJobs(@Query() paginationDto: PaginationDto) {
    return this.jobService.browseJobs(paginationDto);
  }

  /*--------------------------------------------------
              get job details
  --------------------------------------------------*/

  @Get('jobdetails/:id')
  @ApiOperation({
    summary: 'Get job details by ID 🔯🔯🔯',
    description:
      'Returns the details of a specific job by its ID for the editor dashboard.',
  })
  async getJobDetails(
    @Param('id') jobId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.jobService.getJobDetails(jobId, paginationDto);
  }
}
