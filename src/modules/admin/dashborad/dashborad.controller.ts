import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DashboradService } from './dashborad.service';
import { CreateDashboradDto } from './dto/create-dashborad.dto';
import { UpdateDashboradDto } from './dto/update-dashborad.dto';

@Controller('dashborad')
export class DashboradController {
  constructor(private readonly dashboradService: DashboradService) {}

  @Post()
  create(@Body() createDashboradDto: CreateDashboradDto) {
    return this.dashboradService.create(createDashboradDto);
  }

  @Get()
  findAll() {
    return this.dashboradService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dashboradService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDashboradDto: UpdateDashboradDto) {
    return this.dashboradService.update(+id, updateDashboradDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dashboradService.remove(+id);
  }
}
