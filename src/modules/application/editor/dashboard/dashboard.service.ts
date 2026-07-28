import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /*----------------------------------------
               My Order List
  ----------------------------------------*/

  async getMyOrders(userId: string, paginationDto: PaginationDto) {

    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [hiresCount, biddedJobsCount, allHires, allBiddedJobs] =
      
      await this.prisma.$transaction([
      
        this.prisma.hire.count({
          where: { hire_profile_id: userId },
        }),
       
        this.prisma.jOB.count({
          where: {
            bids: {
              some: { user_id: userId, status: 'ACCEPTED' },
            },
          },
        }),
      
        this.prisma.hire.findMany({
          where: { hire_profile_id: userId },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        }),
       
        this.prisma.jOB.findMany({
          where: {
            bids: {
              some: { user_id: userId, status: 'ACCEPTED' },
            },
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        }),
      ]);

    const formattedHires = allHires.map((hire) => ({
      id: hire.id,
      project_title: hire.project_title,
      project_budget: hire.project_budget,
      project_duration: hire.project_duration
        ? `${hire.project_duration} Days`
        : 'N/A',
      total_amount: hire.total_amount,
      status: hire.status,
      type: 'DIRECT_HIRE',
      photo: hire.project_photo,
      client: hire.user,
      created_at: hire.createdAt,
    }));

    const formattedBiddedJobs = allBiddedJobs.map((job) => ({
      id: job.id,
      project_title: job.job_title,
      project_budget: job.project_budget,
      project_duration: job.project_duration
        ? `${job.project_duration} Days`
        : 'N/A',
      total_amount: job.total_payment,
      status: job.status,
      type: 'BIDDED_JOB',
      photo: job.job_photo,
      client: job.user,
      created_at: job.created_at,
    }));

    const combinedOrders = [...formattedHires, ...formattedBiddedJobs].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const totalItems = hiresCount + biddedJobsCount;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedOrders = combinedOrders.slice(skip, skip + limit);

    const finalOrders = paginatedOrders.map(
      ({ created_at, ...orderData }) => orderData,
    );

    return {
      success: true,
      message: 'Active orders retrieved successfully',
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
      data: finalOrders,
    };
  }


 
}
