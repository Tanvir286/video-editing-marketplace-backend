import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@ApiTags('🎬 Editor Delivery')
@ApiBearerAuth(USER_TYPES.EDITOR)
@UseGuards(JwtAuthGuard)
@Controller('editor/delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /*-----------------------------------
       Submit Job Delivery
  -----------------------------------*/
  @Post()
  @ApiOperation({
    summary: 'Submit job delivery 🎬',
    description:
      'Allows an editor to submit work for a job with an optional attachment file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        job_id: { type: 'string', example: 'job-id-123' },
        message: {
          type: 'string',
          example: 'Here is the completed video file and project files.',
        },
        attachment_file: { type: 'string', format: 'binary' },
      },
      required: ['job_id'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Delivery submitted successfully',
  })
  @UseInterceptors(
    FileInterceptor('attachment_file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  )
  async createDelivery(
    @Req() req: any,
    @Body() createDeliveryDto: CreateDeliveryDto,
    @UploadedFile() attachment_file?: Express.Multer.File,
  ) {
    const userId = req.user?.userId;
    return this.deliveryService.createDelivery(
      userId,
      createDeliveryDto,
      attachment_file,
    );
  }

  /*-----------------------------------
       Get My Deliveries
  -----------------------------------*/
  @Get('my-deliveries')
  @ApiOperation({
    summary: 'Get my submitted deliveries',
    description: 'Returns all delivery submissions created by the authenticated editor.',
  })
  @ApiResponse({
    status: 200,
    description: 'My deliveries retrieved successfully',
  })
  async getMyDeliveries(@Req() req: any) {
    const userId = req.user?.userId;
    return this.deliveryService.getMyDeliveries(userId);
  }

  /*-----------------------------------
       Get Job Deliveries
  -----------------------------------*/
  @Get('job/:jobId')
  @ApiOperation({
    summary: 'Get deliveries for a specific job',
    description: 'Returns all delivery submissions for a specific job ID.',
  })
  @ApiParam({
    name: 'jobId',
    required: true,
    description: 'Job ID to fetch deliveries for',
  })
  @ApiResponse({
    status: 200,
    description: 'Job deliveries retrieved successfully',
  })
  async getJobDeliveries(@Req() req: any, @Param('jobId') jobId: string) {
    const userId = req.user?.userId;
    return this.deliveryService.getJobDeliveries(jobId, userId);
  }

  /*-----------------------------------
       Get Delivery Details by ID
  -----------------------------------*/
  @Get(':id')
  @ApiOperation({
    summary: 'Get delivery details by ID',
    description: 'Returns detailed information for a specific delivery submission.',
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
