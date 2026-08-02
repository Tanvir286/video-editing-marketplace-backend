import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('🏳️Client Dashboard')
@UseGuards(JwtAuthGuard)
@Controller('client/dashboard')
export class DashboardController {

  constructor(private readonly dashboardService: DashboardService) {}

  /*----------------------------------------
             Jobs All List
  ----------------------------------------*/
   




  
}
