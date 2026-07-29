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

@ApiTags('🏳️Editor Job Management')
@ApiBearerAuth(USER_TYPES.EDITOR)
@UseGuards(JwtAuthGuard)
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  /*--------------------------------------------------
              get quick match result
  --------------------------------------------------*/
  @Get('quick-match')
  @ApiOperation({
    summary: 'Get quick match pending jobs',
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
  @ApiOkResponse({
    description: 'Successfully retrieved pending jobs',
    schema: {
      example: {
        success: true,
        message: 'Pending jobs fetched successfully',
        pagination: {
          page: 1,
          limit: 10,
          total: 24,
          totalPages: 3,
        },
        data: [
          {
            id: 'job-id-123',
            created_at: '2026-06-30T09:00:00.000Z',
            job_title:
              'I will do SEO backlinks with blogger outreach for high quality link building',
            job_description:
              'Create quality backlinks and outreach links for better ranking.',
            total_payment: 150,
            project_duration: 5,
            status: 'PENDING',
            deadline: '2026-07-05T09:00:00.000Z',
            skill: 'SEO, Backlink Outreach',
            job_photo: 'job-photo.jpg',
            job_photo_url:
              'https://cdn.example.com/storage/job-photo/job-photo.jpg',
            user_name: 'Marvin McKinney',
            user_location: 'Pakistan',
            user_skill: 'SEO Specialist',
          },
        ],
      },
    },
  })
  async quickMatch(@Query() paginationDto: PaginationDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.jobService.quickMatch(paginationDto, userId);
  }

  /*--------------------------------------------------
              browse jobs
  --------------------------------------------------*/
  @Get('browse-jobs')
  @ApiOperation({
    summary: 'Browse pending jobs',
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
  @ApiOkResponse({
    description: 'Successfully retrieved browse jobs',
    schema: {
      example: {
        success: true,
        message: 'Pending jobs fetched successfully',
        pagination: {
          page: 1,
          limit: 10,
          total: 24,
          totalPages: 3,
        },
        data: [
          {
            id: 'job-id-123',
            created_at: '2026-06-30T09:00:00.000Z',
            job_title:
              'I will do SEO backlinks with blogger outreach for high quality link building',
            job_description:
              'Create quality backlinks and outreach links for better ranking.',
            total_payment: 150,
            project_duration: 5,
            status: 'PENDING',
            deadline: '2026-07-05T09:00:00.000Z',
            skill: 'SEO, Backlink Outreach',
            job_photo: 'job-photo.jpg',
            job_photo_url:
              'https://cdn.example.com/storage/job-photo/job-photo.jpg',
            user_name: 'Marvin McKinney',
            user_location: 'Pakistan',
            user_skill: 'SEO Specialist',
          },
        ],
      },
    },
  })
  async browseJobs(@Query() paginationDto: PaginationDto) {
    return this.jobService.browseJobs(paginationDto);
  }

  /*--------------------------------------------------
              get job details
  --------------------------------------------------*/

  @Get('jobdetails/:id')
  @ApiOperation({
    summary: 'Get job details by ID',
    description:
      'Returns the details of a specific job by its ID for the editor dashboard.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Bid page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Bids per page',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved job details',
    schema: {
      example: {
        success: true,
        message: 'Job details retrieved successfully',
        data: {
          id: 'job-id-123',
          job_title:
            'I will do SEO backlinks with blogger outreach for high quality link building',
          job_description:
            'Create quality backlinks and outreach links for better ranking.',
          job_category: 'SEO',
          job_photo_url:
            'https://cdn.example.com/storage/job-photo/job-photo.jpg',
          project_budget: 150,
          platform: 'FIVERR',
          duration: 5,
          country: 'Pakistan',
          skill: 'SEO, Backlink Outreach',

          attachment: [
            {
              id: 'att-1',
              name: 'brief.pdf',
              file: 'brief.pdf',
              type: 'application/pdf',
              created_at: '2026-06-30T09:00:00.000Z',
            },
          ],
          attachment_count: 1,

          bids: [
            {
              id: 'bid-1',
              status: 'PENDING',
              message: 'I can complete this project professionally.',
              created_at: '2026-06-30T09:30:00.000Z',
            },
            {
              id: 'bid-2',
              status: 'ACCEPTED',
              message: 'Experienced SEO expert here.',
              created_at: '2026-06-30T10:00:00.000Z',
            },
          ],

          user_name: 'Marvin McKinney',
          user_photo_url: 'https://cdn.example.com/storage/avatar/user.jpg',
          user_location: 'Pakistan',
          user_language: 'English',
        },
      },
    },
  })
  async getJobDetails(
    @Param('id') jobId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.jobService.getJobDetails(jobId, paginationDto);
  }

  /*--------------------------------------------------
               hire request
  --------------------------------------------------*/
}
