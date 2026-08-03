import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BidStatus } from 'prisma/generated';
import { ImageGetUtil } from 'src/common/utils/image/image.util';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /*----------------------------------------
             Jobs All List
  ----------------------------------------*/
  async getJobsAllList(paginationDto: PaginationDto, userId: string) {
    
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [allHires, allBiddedJobs] = await this.prisma.$transaction([
     
      this.prisma.hire.findMany({
        where: { user_id: userId },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.jOB.findMany({
        where: {user_id: userId, 
          bids: { some: { 
            status: BidStatus.ACCEPTED 
          } 
        }},
        select: {
          id: true,
          created_at: true,
          job_title: true,
          job_budget: true,
          job_duration: true,
          job_total_payment: true,
          job_status: true,
          job_photo: true,
          user: true,
          bids: {
            select: {
              user_id: true,
              status: true,
              amount: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),

    ]);

    const formattedHires = allHires.map((hire) => ({
      id: hire.id,
      created_at: hire.createdAt,
      project_title: hire.project_title,
      photo: hire.project_photo ? ImageGetUtil.jobPhotoUrl(hire.project_photo) : null,
      total_amount: hire.total_amount,
      status: hire.status,
      type: 'DIRECT_HIRE',
    }));

    const formattedBiddedJobs = allBiddedJobs.map((job) => ({
      id: job.id,
      created_at: job.created_at,
      project_title: job.job_title,
      total_amount: job.bids[0]?.amount || 0,
      photo: job.job_photo ? ImageGetUtil.jobPhotoUrl(job.job_photo) : null,
      status: job.job_status,
      type: 'BIDDED_JOB',
    }));
   
    const combinedList = [...formattedHires, ...formattedBiddedJobs].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const total = combinedList.length;
    const paginated = combinedList.slice(skip, skip + limit);

    return {
      success: true,
      message: 'Client jobs and hires retrieved successfully',
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
  


}
