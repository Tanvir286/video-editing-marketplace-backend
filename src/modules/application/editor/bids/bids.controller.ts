import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';

@ApiTags('🏳️Editor Bids')
@ApiBearerAuth(USER_TYPES.EDITOR)
@Controller('bids')
@UseGuards(JwtAuthGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  // add a new bid for a job

  @Post(':jobId/create')
  @ApiOperation({ summary: 'Create a bid for a job' })
  @ApiParam({ name: 'jobId', description: 'Job ID to bid on' })
  @ApiBody({ type: CreateBidDto })
  @ApiResponse({ status: 201, description: 'Bid created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or missing user ID',
  })
  async create(
    @Req() req: any,
    @Param('jobId') jobId: string,
    @Body() dto: CreateBidDto,
  ) {
    const userId = req.user?.userId;

    if (!userId) throw new BadRequestException('User ID not found in request');

    const result = await this.bidsService.createBid(userId, dto, jobId);

    return {
      success: true,
      message: 'Bid created successfully',
      data: result,
    };
  }

  //-------------------------------------

  //
  @Get('allJobs')
  @ApiOperation({ summary: 'Get all bids for the authenticated editor' })
  @ApiResponse({ status: 200, description: 'Bids fetched successfully' })
  findAll(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User ID not found in request');
    return this.bidsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single bid by ID' })
  @ApiParam({ name: 'id', description: 'Bid ID' })
  @ApiResponse({ status: 200, description: 'Bid fetched successfully' })
  findOne(@Param('id') id: string) {
    return this.bidsService.findOne(id);
  }

  @Patch('accept/:bidId')
  @ApiOperation({ summary: 'Accept or update a bid status' })
  @ApiParam({ name: 'bidId', description: 'Bid ID to update' })
  @ApiBody({ type: UpdateBidDto })
  @ApiResponse({ status: 200, description: 'Bid status updated successfully' })
  accept(@Param('bidId') bidId: string, @Body() dto: UpdateBidDto) {
    return this.bidsService.updateBidStatus(bidId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bid' })
  @ApiParam({ name: 'id', description: 'Bid ID to delete' })
  @ApiResponse({ status: 200, description: 'Bid deleted successfully' })
  remove(@Param('id') id: string) {
    return this.bidsService.remove(+id);
  }
}
