import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@ApiTags('🏳️Editor Dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth(USER_TYPES.EDITOR)
@Controller('editor/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /*----------------------------------------
              Active Jobs Count
  ----------------------------------------*/

  @Get('active-jobs-count')
  @ApiOperation({
    summary: 'Get count of active jobs ✧',
    description:
      'Returns count of jobs with ACCEPTED bids and IN_PROGRESS jobs.',
  })
  @ApiOkResponse({
    description: 'Successfully retrieved active jobs count',
    schema: {
      example: {
        success: true,
        message: 'Active jobs count retrieved successfully',
        data: {
          approved_bids: 5,
          in_progress_jobs: 3,
          total_active_jobs: 8,
        },
      },
    },
  })
  async getActiveJobsCount(@Req() req: any) {
    const userId = req.user.userId;
    return await this.dashboardService.getActiveJobsCount(userId);
  }

  /*----------------------------------------
               My Order List
  ----------------------------------------*/

  @Get('my-orders')
  @ApiOperation({
    summary: 'Get all active orders ✧',
    description:
      'Direct Hires and Accepted Bidded Jobs are combined into a single flat list and sorted in chronological order (most recent first).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({
    description:
      'Successfully retrieved active orders in a single unified list',
    schema: {
      example: {
        success: true,
        message: 'Active orders retrieved successfully',
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 24,
          totalPages: 3,
        },
        data: [
          {
            id: 'hire-id-123',
            project_title:
              "I will craft quality backlinks for your website's SEO.",
            project_budget: 55,
            project_duration: '5 Days',
            total_amount: 55,
            status: 'IN_PROGRESS',
            type: 'DIRECT_HIRE',
            photo: 'url_to_photo_or_thumbnail',
            client: {
              id: 'client-id-1',
              name: 'Jane Cooper',
              email: 'jane@waffles.com',
              avatar: 'avatar_url',
            },
          },
          {
            id: 'job-id-789',
            project_title:
              "I will craft quality backlinks for your website's SEO.",
            project_budget: 55,
            project_duration: '5 Days',
            total_amount: 55,
            status: 'CANCEL',
            type: 'BIDDED_JOB',
            photo: 'url_to_photo_or_thumbnail',
            client: {
              id: 'client-id-2',
              name: 'Wade Warren',
              email: 'wade@waffles.com',
              avatar: 'avatar_url',
            },
          },
        ],
      },
    },
  })
  async getMyOrders(@Req() req: any, @Query() paginationDto: PaginationDto) {
    const userId = req.user.userId;
    return await this.dashboardService.getMyOrders(userId, paginationDto);
  }
}
