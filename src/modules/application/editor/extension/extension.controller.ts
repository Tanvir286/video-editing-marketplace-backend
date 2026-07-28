import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { CreateExtensionDto } from './dto/create-extension.dto';
import { UpdateExtensionDto } from './dto/update-extension.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';

@ApiTags('Editor Extension')
@ApiBearerAuth(USER_TYPES.EDITOR)
@Controller('extension')
@UseGuards(JwtAuthGuard)
export class ExtensionController {
  constructor(private readonly extensionService: ExtensionService) {}

  @Post(':jobId/create')
  create(@Body() createExtensionDto: CreateExtensionDto, @Req() req: any, @Param('jobId') jobId: string) {
    const user_id = req.user?.userId;
    return this.extensionService.createRequest(user_id, jobId, createExtensionDto);
  }

@Patch(':requestId/action')
  async handleAction(
    @Req() req: any,
    @Param('requestId') requestId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
  ) {
    const user_id = req.user?.userId;
    return this.extensionService.processRequest(user_id, requestId, status);
  }
}
