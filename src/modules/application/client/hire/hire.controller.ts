import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateHireDto } from './dto/create-hire.dto';
import { HireService } from './hire.service';
import { UpdateHireDto } from 'src/modules/application/client/hire/dto/update-hire.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';

@ApiTags('Client Hires')
@ApiBearerAuth(USER_TYPES.CLIENT)
@Controller('hires')
export class HireController {
  constructor(private readonly hireService: HireService) {}

  @Post(':hireProfileId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'attachments', maxCount: 10 },
      { name: 'project_photo', maxCount: 1 },
    ]),
  )
  async create(
    @Req() req: any,
    @Param('hireProfileId') hireProfileId: string,
    @Body() dto: CreateHireDto,
    @UploadedFiles()
    files: {
      attachments?: Express.Multer.File[];
      project_photo?: Express.Multer.File[];
    },
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User id not found in request');
    const attachments = files?.attachments ?? [];
    const projectPhoto = files?.project_photo?.[0];

    if (!attachments.length) {
      throw new BadRequestException('At least one attachment is required');
    }

    return this.hireService.createHire(
      userId,
      dto,
      attachments,
      projectPhoto,
      hireProfileId,
    );
  }

  @Get('all/client')
  @UseGuards(JwtAuthGuard)
  async findAllClient(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q = '',
    @Query('status') status?: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User id not found in request');
    return this.hireService.getAllHiresClient({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
      status,
      userId,
    });
  }

  @Get('all/editor')
  @UseGuards(JwtAuthGuard)
  async findAllEditor(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('q') q = '',
    @Query('status') status?: string,
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('User id not found in request');
    return this.hireService.getAllHiresEditor({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      q,
      status,
      userId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.hireService.getHireById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateHireDto: UpdateHireDto) {
    return this.hireService.updateStatus(id, updateHireDto);
  }
}
