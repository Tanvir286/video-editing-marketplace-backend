import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientCreateJobDto } from './dto/create-job.dto';
import { ClientUpdateJobDto } from './dto/update-job.dto';
import { ClientJobPaginationDto } from './dto/pagination-job.dto';
import { BidStatus } from 'prisma/generated';
import { ImageGetUtil } from 'src/common/utils/image/image.util';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}


  //  const MIN_PAYOUT_MAP: Record<string, number> = {
  //     MIN_1_5: 5.0,
  //     MIN_5_10: 8.0,
  //     MIN_10_15: 12.0,
  //     MIN_15_20: 16.0,
  //     MIN_20_30: 20.0,
  //     MIN_30_40: 25.0,
  //     MIN_40_50: 30.0,
  //     MIN_50_60: 40.0,
  //     MIN_60_120: 30.0,
  //     MIN_120: 10.0,
  //   };



  /*----------------------------------------
          New Job Api Endpoints Start
  ----------------------------------------*/

  async myJobs(
    paginationDto: ClientJobPaginationDto, 
    userId: string
  ) {
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;
    const statusFilter = paginationDto?.status ?? null;

    const [allHires, allBiddedJobs] = await this.prisma.$transaction([
    
      this.prisma.hire.findMany({
        where: {
          user_id: userId,
          ...(statusFilter ? { status: statusFilter as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.jOB.findMany({
        where: {
          user_id: userId,
          bids: { some: { status: BidStatus.ACCEPTED } },
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        select: {
          id: true,
          created_at: true,
          job_title: true,
          project_budget: true,
          project_duration: true,
          total_payment: true,
          status: true,
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
      photo: hire.project_photo
        ? ImageGetUtil.jobPhotoUrl(hire.project_photo)
        : null,
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
      status: job.status,
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

  /*----------------------------------------
       Create A Job Start
  ----------------------------------------*/

  async createJob(
    userId: string,
    dto: ClientCreateJobDto,
    files: Express.Multer.File[],
    jobPhoto?: Express.Multer.File,
  ) {
    
  }
  
  
}
