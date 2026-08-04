import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { BidPaginationDto } from './dto/pagination-bid.dto';
import { BidStatus } from 'prisma/generated';

@ApiTags('🏳️Editor Bids')
@ApiBearerAuth(USER_TYPES.EDITOR)
@Controller('bids')
@UseGuards(JwtAuthGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  // my job proposal
  @Get('job')
  @ApiOperation({ summary: 'Get all job proposal' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BidStatus,
    description: 'Filter by bid status (PENDING,CANCELLED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Job proposal list retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Job proposal not found' })
  async getJobProposal(
    @Query() paginationDto: BidPaginationDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    return this.bidsService.getJobProposal(userId, paginationDto);
  }

  // create a new bid
  @Post(':jobId/create')
  @ApiOperation({ summary: 'Create a bid for a job 🔯🔯🔯' })
  @ApiParam({ name: 'jobId', description: 'Job ID to bid on' })
  @ApiBody({
    type: CreateBidDto,
    examples: {
      example1: {
        summary: 'Default Bid Example',
        value: {
          amount: 250,
          req_date: 3,
          message: 'I can complete this project within 3 days.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Bid created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or duplicate bid' })
  async create(
    @Req() req: any,
    @Param('jobId') jobId: string,
    @Body() dto: CreateBidDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User ID not found');

    const result = await this.bidsService.createBid(userId, dto, jobId);
    return { success: true, message: 'Bid created successfully', data: result };
  }

  // job list with bid
  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get all bids placed on a specific job 🔯🔯🔯' })
  @ApiParam({ name: 'jobId', description: 'Job ID to retrieve bids list' })
  @ApiResponse({ status: 200, description: 'Bids list retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getBidsByJob(@Param('jobId') jobId: string) {
    const result = await this.bidsService.getBidsByJobId(jobId);
    return {
      success: true,
      message: 'Bids list retrieved successfully',
      total: result.length,
      data: result,
    };
  }

  // delete a bid
  @Delete('biddelete/:bidId')
  @ApiOperation({ summary: 'Delete a bid' })
  @ApiParam({ name: 'bidId', description: 'Bid ID to delete' })
  @ApiResponse({ status: 200, description: 'Bid deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  async delete(@Param('bidId') bidId: string) {
    const result = await this.bidsService.deleteBid(bidId);
    return { success: true, message: 'Bid deleted successfully', data: result };
  }
}
