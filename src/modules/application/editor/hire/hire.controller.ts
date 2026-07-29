import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { HireService } from './hire.service';
import { CreateHireDto } from './dto/create-hire.dto';
import { UpdateHireDto } from './dto/update-hire.dto';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';

@ApiTags('🏳️Editor Hire Management')
@ApiBearerAuth(USER_TYPES.EDITOR)
@UseGuards(JwtAuthGuard)
@Controller('hire')
export class HireController {
 
  constructor(private readonly hireService: HireService) {}


  // Get Hire Request
  @Get('hire-request')
  @ApiOperation({
    summary: 'Get hire request',
    description:
      'Returns the paginated list of hire requests for the editor dashboard.',
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
    description: 'Successfully retrieved hire requests',
    schema: {
      example: {
        success: true,
        message: 'Hire requests fetched successfully',
        pagination: {
          page: 1,
          limit: 10,
          total: 24,
          totalPages: 3,
        },
        data: [
          {
            id: 'hire-id-123',
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
  async getHireRequest(
    @Query() paginationDto: PaginationDto,
    @Req() req: any
  ) {
    const editorId = req.user.userId;
    return this.hireService.getHireRequest(paginationDto, editorId);
  }


 
}
