import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { DeliveryService } from './delivery.service';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@ApiTags('🏴 Client Delivery')
@ApiBearerAuth(USER_TYPES.CLIENT)
@UseGuards(JwtAuthGuard)
@Controller('client/delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /*-----------------------------------
       Get Job Deliveries
  -----------------------------------*/
  @Get('job/:jobId')
  @ApiOperation({
    summary: 'Get deliveries for a job 🏴',
    description:
      'Returns all delivery submissions for a specific job created by the authenticated client.',
  })
  @ApiParam({
    name: 'jobId',
    required: true,
    description: 'Job ID owned by the authenticated client',
  })
  @ApiResponse({
    status: 200,
    description: 'Deliveries retrieved successfully',
  })
  async getJobDeliveries(@Req() req: any, @Param('jobId') jobId: string) {
    const userId = req.user?.userId;
    return this.deliveryService.getJobDeliveries(jobId, userId);
  }

  /*-----------------------------------
       Update Delivery Status (Accept / Reject / Request Revision)
  -----------------------------------*/
  @Patch(':deliveryId/status')
  @ApiOperation({
    summary: 'Accept, reject, or request revision for a delivery 🏴',
    description:
      'Allows a client to accept work (COMPLETED), reject it, or request revision (IN_PROGRESS).',
  })
  @ApiParam({
    name: 'deliveryId',
    required: true,
    description: 'Delivery ID to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery status updated successfully',
  })
  async updateDeliveryStatus(
    @Req() req: any,
    @Param('deliveryId') deliveryId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    const userId = req.user?.userId;
    return this.deliveryService.updateDeliveryStatus(deliveryId, userId, dto);
  }

  /*-----------------------------------
       Get Delivery Details by ID
  -----------------------------------*/
  @Get(':id')
  @ApiOperation({
    summary: 'Get delivery details by ID 🏴',
    description:
      'Returns detailed information for a specific delivery submission.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Delivery ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery details retrieved successfully',
  })
  async getDeliveryById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId;
    return this.deliveryService.getDeliveryById(id, userId);
  }
}
