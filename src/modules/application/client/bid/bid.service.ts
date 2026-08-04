import { Injectable } from '@nestjs/common';
import { ImageGetUtil } from 'src/common/utils/image/image.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { BidClientPaginationDto } from './dto/bid-pagination.dto';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@Injectable()
export class BidService {

  constructor(private prisma: PrismaService) {}

  /*------------------------------------------
          all job proposal list
  ------------------------------------------*/
  async getAllJobProposal(
    paginationDto: BidClientPaginationDto,
    userId: string
  ) {
   
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;
    const status = paginationDto?.status;

    const where: any = {
      job: {
        user_id: userId,
      },
    };

    if (status) {
      where.status = status;
    }

    const [bids, total] = await this.prisma.$transaction([
      this.prisma.bid.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              job_title: true,
              job_budget: true,
              job_total_payment: true,
              job_status: true,
              job_photo: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.bid.count({ where }),
    ]);

    const formattedBids = bids.map((bid) => ({
      id: bid.id,
      created_at: bid.created_at,
      job_id: bid.job?.id,
      job_title: bid.job?.job_title,
      job_photo: bid.job?.job_photo,
      job_photo_url: bid.job?.job_photo
        ? ImageGetUtil.jobPhotoUrl(bid.job.job_photo)
        : null,
      amount: bid.amount,
      req_date: bid.req_date,
      message: bid.message,
      status: bid.status,
      user: bid.user
        ? {
            id: bid.user.id,
            name: bid.user.name,
            email: bid.user.email,
            avatar: bid.user.avatar ? ImageGetUtil.avatarUrl(bid.user.avatar) : null,
          }
        : null,
    }));

    return {
      success: true,
      message: 'Job proposals retrieved successfully',
      data: formattedBids,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }


   /*------------------------------------------
           Job ID with proposal list
  ------------------------------------------*/
  async getJobProposalbyId(
    paginationDto: PaginationDto,
    userId: string,
    jobId: string,
  ) {
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;
   

    const job = await this.prisma.jOB.findFirst({
      where: {
        id: jobId,
        user_id: userId,
      },
      select: {
        id: true,
        job_title: true,
        job_photo: true,
      },
    });

    if (!job) {
      return {
        success: false,
        message: 'Job not found',
        data: [],
      };
    }

    const where: any = {
      jobId,
    };

    const [bids, total] = await this.prisma.$transaction([
      this.prisma.bid.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.bid.count({ where }),
    ]);

    const formattedBids = bids.map((bid) => ({
      id: bid.id,
      created_at: bid.created_at,
      amount: bid.amount,
      req_date: bid.req_date,
      message: bid.message,
      status: bid.status,
      user: bid.user
        ? {
            id: bid.user.id,
            name: bid.user.name,
            email: bid.user.email,
            avatar: bid.user.avatar,
            avatar_url: bid.user.avatar
              ? ImageGetUtil.avatarUrl(bid.user.avatar)
              : null,
          }
        : null,
    }));

    return {
      success: true,
      message: 'Job proposals retrieved successfully',
      job: {
        id: job.id,
        job_title: job.job_title,
        job_photo: job.job_photo,
        job_photo_url: job.job_photo
          ? ImageGetUtil.jobPhotoUrl(job.job_photo)
          : null,
      },
      data: formattedBids,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
   







}
