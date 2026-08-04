import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientCreateJobDto } from './dto/create-job.dto';
import { ClientUpdateJobDto } from './dto/update-job.dto';
import { ClientJobPaginationDto } from './dto/pagination-job.dto';
import { BidStatus } from 'prisma/generated';
import { ContentLength } from 'prisma/generated';
import { ImageGetUtil } from 'src/common/utils/image/image.util';
import { StringHelper } from 'src/common/helper/string.helper';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MIN_PAYOUT_MAP: Record<ContentLength, number> = {
    MIN_1_5: 5.0,
    MIN_5_10: 8.0,
    MIN_10_15: 12.0,
    MIN_15_20: 16.0,
    MIN_20_30: 20.0,
    MIN_30_40: 25.0,
    MIN_40_50: 30.0,
    MIN_50_60: 40.0,
    MIN_60_120: 30.0,
    MIN_120: 10.0,
  };


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

  /*----------------------------------------
       Create A Job Start
  ----------------------------------------*/

  async createJob(
    userId: string,
    dto: ClientCreateJobDto,
    files: {
      job_photo?: Express.Multer.File[];
      style?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
      doc?: Express.Multer.File[];
    },
  ) {

    const data: any = {};

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    const minBudget = this.MIN_PAYOUT_MAP[dto.job_content_length];
    if (minBudget && dto.job_budget < minBudget) {
      throw new BadRequestException(
        `Minimum budget for content length "${dto.job_content_length}" must be at least $${minBudget}`,
      );
    }

    if (files?.job_photo) {
      const jobPhotoFileName = `${StringHelper.randomString()}_${files.job_photo[0].originalname}`;
      await SojebStorage.put(
        appConfig().storageUrl.jobPhoto + '/' + jobPhotoFileName,
        files.job_photo[0].buffer
      );
      data.job_photo = jobPhotoFileName;
    }


    if (files?.style) {
       const styleFileName = `${StringHelper.randomString()}_${files.style[0].originalname}`;  
       
        await SojebStorage.put(
          appConfig().storageUrl.jobPhoto + '/' + styleFileName,
          files.style[0].buffer
        );
        data.job_style = styleFileName;
    }


    if (files?.pdf) {
      const pdfFileName = `${StringHelper.randomString()}_${files.pdf[0].originalname}`;
      await SojebStorage.put(
        appConfig().storageUrl.jobPhoto + '/' + pdfFileName,
        files.pdf[0].buffer
      );
      data.job_pdf = pdfFileName;
    }

    if (files?.doc) {
      const docFileName = `${StringHelper.randomString()}_${files.doc[0].originalname}`;
      await SojebStorage.put(
        appConfig().storageUrl.jobPhoto + '/' + docFileName,
        files.doc[0].buffer
      );
      data.job_doc = docFileName;
    }

    const jobTotalPayment = Math.round(dto.job_budget * 1.2 * 100) / 100;

    const newJob = await this.prisma.jOB.create({
      data: {
        job_title: dto.job_title,
        job_description: dto.job_description,
        job_photo: data.job_photo,
        job_category: dto.job_category,
        job_skill: dto.job_skill, 
        job_budget: dto.job_budget,
        job_duration: dto.job_duration,
        job_content_length: dto.job_content_length,
        job_platform: dto.job_platform,
        job_total_payment: jobTotalPayment,
        job_style_reference: data.job_style,
        job_pdf: data.job_pdf,
        job_documentation: data.job_doc,
        user_id: userId,
      },
    });

    return {
      success: true,
      message: 'Job created successfully',
      data: newJob,
    };

  }
  
  
}
