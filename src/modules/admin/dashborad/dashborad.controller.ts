import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboradService } from './dashborad.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@ApiTags('Admin Dashboard 〄')
@ApiBearerAuth(USER_TYPES.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller(['admin/dashboard', 'admin/dashborad', 'dashborad'])
export class DashboradController {
  constructor(private readonly dashboradService: DashboradService) {}

  /*-----------------------------------------------------
      Total Editor, Client, Revenue Api
  ------------------------------------------------------*/

   @Get()
   @ApiOperation({
      summary: 'Get admin dashboard stats (Total Editors, Total Clients, Total Revenue)',
      description: 'Returns total counts and month-over-month growth metrics for Total Editors, Total Clients, and Total Revenue.',
   })
   @ApiOkResponse({
      description: 'Admin dashboard stats retrieved successfully',
      schema: {
         example: {
            success: true,
            message: 'Admin dashboard stats retrieved successfully',
            data: {
               total_editors: 200,
               editors_growth_percentage: 10,
               editors_growth_direction: 'up',
               total_clients: 200,
               clients_growth_percentage: 6,
               clients_growth_direction: 'up',
               total_revenue: 25000,
               revenue_growth_percentage: 8.5,
               revenue_growth_direction: 'up',
               cards: {
                  editors: {
                     title: 'Total Editors',
                     value: 200,
                     growth_percentage: 10,
                     growth_direction: 'up',
                     comparison_text: 'Last Month',
                     this_month_count: 20,
                     last_month_count: 18,
                  },
                  clients: {
                     title: 'Total Clients',
                     value: 200,
                     growth_percentage: 6,
                     growth_direction: 'up',
                     comparison_text: 'Last Month',
                     this_month_count: 12,
                     last_month_count: 11,
                  },
                  revenue: {
                     title: 'Total Revenue',
                     value: 25000,
                     growth_percentage: 8.5,
                     growth_direction: 'up',
                     comparison_text: 'Last Month',
                     this_month_amount: 3500,
                     last_month_amount: 3200,
                  },
               },
            },
         },
      },
   })
   async getDashboardStats() {
      return await this.dashboradService.getDashboardStats();
   }



  
}



  
