import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ExtensionService } from './extension.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { ApproveOrRejectJobExtensionDto } from './dto/approve-or-reject-job-extension.dto';

@ApiTags('🏴 Client Extension')
@ApiBearerAuth(USER_TYPES.CLIENT)
@Controller('extension')
@UseGuards(JwtAuthGuard)
export class ExtensionController {
  constructor(private readonly extensionService: ExtensionService) {}

  /*-----------------------------------
       job id wise extension list
  -----------------------------------*/
  @Get('extension/:jobId')
  @ApiOperation({
    summary: 'Get extensions for a specific job',
    description: 'Returns all extension requests for a job owned by the authenticated client.',
  })
  @ApiParam({
    name: 'jobId',
    required: true,
    description: 'Job ID created by the authenticated client',
  })
  @ApiResponse({
    status: 200,
    description: 'Extension requests retrieved successfully',
  })
  async findAll(@Req() req: any, @Param('jobId') jobId: string) {
    const userId = req.user?.userId;
    return this.extensionService.findJob(jobId, userId);
  }

  /*-----------------------------------
       approve or reject job extension
  -----------------------------------*/
  @Patch('extension/:extensionId')
  @ApiOperation({
    summary: 'Approve or reject job extension',
    description: 'Approves or rejects a job extension request.',
  })
  @ApiParam({
    name: 'extensionId',
    required: true,
    description: 'Extension ID to approve or reject',
  })
  @ApiResponse({
    status: 200,
    description: 'Job extension approved or rejected successfully',
  })
  async approveOrReject(
    @Req() req: any,
    @Param('extensionId') extensionId: string,
    @Body() dto: ApproveOrRejectJobExtensionDto,
  ) {
    const userId = req.user?.userId;
    return this.extensionService.approveOrReject(extensionId, userId, dto);
  }
  
  



}

