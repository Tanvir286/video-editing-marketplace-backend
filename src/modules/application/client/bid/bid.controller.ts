import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { BidService } from './bid.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { BidClientPaginationDto } from './dto/bid-pagination.dto';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@ApiTags('🏴 Client Bids')
@ApiBearerAuth(USER_TYPES.CLIENT)
@Controller('bid')
@UseGuards(JwtAuthGuard)
export class BidController {
  constructor(private readonly bidService: BidService) {}

  /*------------------------------------------
          all job proposal list
  ------------------------------------------*/
  @Get('alljob-proposal')
  @ApiOperation({
    summary: 'Get all proposals for my jobs 🔯🔯🔯',
    description:
      'Returns all bids submitted on jobs created by the authenticated client.',
  })
  @ApiResponse({
    status: 200,
    description: 'Proposal list retrieved successfully',
  })
  async getAllJobProposal(
    @Req() req: any,
    @Query() paginationDto: BidClientPaginationDto,
  ) {
    const userId = req.user.userId;
    return this.bidService.getAllJobProposal(paginationDto, userId);
  }

 /*------------------------------------------
           Job ID with proposal list
  ------------------------------------------*/
  @Get('job/:jobId/proposal')
  @ApiOperation({
    summary: 'Get proposals for a specific job',
    description: 'Returns all bids submitted for a specific job.',
  })
  @ApiParam({
    name: 'jobId',
    required: true,
    description: 'Job ID created by the authenticated client',
  })
  async getJobProposal(
    @Req() req: any,
    @Query() paginationDto: PaginationDto,
    @Param('jobId') jobId: string,
  ) {
    const userId = req.user.userId;
    return this.bidService.getJobProposalbyId(paginationDto, userId, jobId);
  }




}
