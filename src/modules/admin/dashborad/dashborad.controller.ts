import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboradService } from './dashborad.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@ApiTags('Admin Dashboard 〄')
@ApiBearerAuth(USER_TYPES.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller(['admin/dashboard', 'admin/dashborad', 'dashborad'])
export class DashboradController {
  constructor(private readonly dashboradService: DashboradService) {}

  /*-----------------------------------------------------
      Total Editor & Total Client Stats API
  ------------------------------------------------------*/
  @Get()
  @ApiOperation({
    summary: 'Get Total Editors and Total Clients Statistics',
    description:
      'Returns total counts and month-over-month growth percentage for Total Editors and Total Clients.',
  })
  @ApiOkResponse({
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          total_editors: {
            total: 200,
            growth_percentage: 10,
            growth_direction: 'up',
            this_month: 20,
            last_month: 18,
          },
          total_clients: {
            total: 200,
            growth_percentage: 6,
            growth_direction: 'up',
            this_month: 12,
            last_month: 11,
          },
        },
      },
    },
  })
  async getDashboardStats() {
    return await this.dashboradService.getDashboardStats();
  }

  /*---------------------------------------------------
                 Top / Total Editors List      
  ----------------------------------------------------*/
  @Get('top-editors')
  @ApiOperation({
    summary: 'Get Top Editors List',
    description:
      'Returns a paginated list of top performing editors sorted by completed jobs, ratings, and earnings.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({
    description: 'Top editors list retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Top editors list retrieved successfully',
        pagination: {
          page: 1,
          limit: 10,
          total_items: 25,
          total_pages: 3,
        },
        data: [
          {
            id: 'editor-cuid-1',
            name: 'John Doe',
            email: 'john@example.com',
            avatar: 'avatar.jpg',
            avatar_url: 'http://localhost:5000/uploads/avatars/avatar.jpg',
            country: 'United States',
            bio: 'Senior Video Editor & Colorist',
            skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
            rating: 4.9,
            total_reviews: 35,
            completed_jobs_count: 42,
            total_earnings: 5200.5,
            joined_at: '2026-01-15T08:30:00.000Z',
          },
        ],
      },
    },
  })
  async getTopEditors(@Query() paginationDto: PaginationDto) {
    return await this.dashboradService.getTopEditors(paginationDto);
  }

  /*---------------------------------------------------
                 Top / Total Clients List      
  ----------------------------------------------------*/
  @Get(['top-clients', 'top-client', 'total-client', 'total-clients'])
  @ApiOperation({
    summary: 'Get Top Clients List',
    description:
      'Returns a paginated list of top clients sorted by total spent, completed projects, and total orders.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({
    description: 'Top clients list retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Top clients list retrieved successfully',
        pagination: {
          page: 1,
          limit: 10,
          total_items: 20,
          total_pages: 2,
        },
        data: [
          {
            id: 'client-cuid-1',
            name: 'Sarah Smith',
            email: 'sarah@example.com',
            avatar: 'avatar.jpg',
            avatar_url: 'http://localhost:5000/uploads/avatars/avatar.jpg',
            country: 'Canada',
            total_projects: 15,
            completed_projects: 12,
            total_jobs_posted: 10,
            total_hires: 5,
            total_spent: 3450.0,
            joined_at: '2026-02-10T11:20:00.000Z',
          },
        ],
      },
    },
  })
  async getTopClients(@Query() paginationDto: PaginationDto) {
    return await this.dashboradService.getTopClients(paginationDto);
  }
}
