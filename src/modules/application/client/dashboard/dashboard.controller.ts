import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@ApiTags('🏴 Client Dashboard')
@ApiBearerAuth(USER_TYPES.CLIENT)
@UseGuards(JwtAuthGuard)
@Controller('client/dashboard')
export class DashboardController {

  constructor(private readonly dashboardService: DashboardService) {}

  /*----------------------------------------
             Jobs All List
  ----------------------------------------*/
  @Get('alljob-client')
  @ApiOperation({ summary: 'Get all client jobs and hires ✪✪✪' })
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
  async getJobsAllList(
    @Query() paginationDto:PaginationDto,
    @Req() req: any) {
    const userId = req.user.userId;
    return await this.dashboardService.getJobsAllList(paginationDto, userId);
  }
   
}
   




  

