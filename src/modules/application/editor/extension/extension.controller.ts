import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  Get,
} from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { CreateExtensionDto } from './dto/create-extension.dto';
import { UpdateExtensionDto } from './dto/update-extension.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { ExtensionStatus } from 'prisma/generated';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('🏳️Editor Extension')
@ApiBearerAuth(USER_TYPES.EDITOR)
@Controller('extension')
@UseGuards(JwtAuthGuard)
export class ExtensionController {
  constructor(private readonly extensionService: ExtensionService) {}

  /*------------------------------------------
           Create Extension Request
  ------------------------------------------*/
  @Post(':jobId/create')
  @ApiOperation({
    summary: 'Create extension request 🔯🔯🔯',
    description:
      'Allows an editor to request extra time for a job that is already in progress.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Need extra time due to additional revisions',
        },
        extension_days: {
          type: 'number',
          example: 3,
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Upload supporting image',
        },
      },
      required: ['message', 'extension_days'],
    },
  })
  @ApiParam({
    name: 'jobId',
    required: true,
    description: 'Job ID for which the extension is requested',
  })
  @ApiResponse({
    status: 201,
    description: 'Extension request created successfully',
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() createExtensionDto: CreateExtensionDto,
    @Req() req: any,
    @UploadedFile() extensionFile: Express.Multer.File,
    @Param('jobId') jobId: string,
  ) {
    const user_id = req.user?.userId;

    return this.extensionService.createRequest(
      user_id,
      jobId,
      createExtensionDto,
      extensionFile,
    );
  }


  /*------------------------------------------
           my Extension Request list
  ------------------------------------------*/
  @Get('my-requests')
  @ApiOperation({
    summary: 'Get my extension requests',
    description: 'Allows an editor to view all extension requests they have created.',
  })
  @ApiResponse({
    status: 200,
    description: 'Extension requests fetched successfully',
  })
  async getMyRequests(@Req() req: any) {
    const user_id = req.user?.userId;
    return this.extensionService.getMyRequests(user_id);
  }
  
  
}
