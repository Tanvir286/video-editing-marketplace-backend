import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { UpdateBidDto } from './dto/update-bid.dto';
import { BidStatus } from 'prisma/generated';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  // add a new bid for a job
  async createBid(userId: string, dto: CreateBidDto, jobId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { type: true },
      });

      if (!user || user.type !== 'EDITOR') {
        throw new BadRequestException(
          'Only users with EDITOR type can place a bid.',
        );
      }

      const existingBid = await this.prisma.bid.findFirst({
        where: {
          user_id: userId,
          jobId: jobId,
        },
      });

      if (existingBid) {
        throw new BadRequestException(
          'You have already placed a bid on this job.',
        );
      }

      const bid = await this.prisma.bid.create({
        data: {
          amount: dto.amount,
          message: dto.message,
          req_date: dto.req_date,
          user_id: userId,
          jobId: jobId,
        },
      });

      return {
        success: true,
        message: 'Bid created successfully',
        data: bid,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Prisma Error:', error);
      throw new BadRequestException(
        'Prisma operation failed. Check if jobId or userId is valid.',
      );
    }
  }

  // ----------------------------------

  // Editor's bids fetch
  async findAll(userId: string) {
    const bids = await this.prisma.bid.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      include: {
        job: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const jobData = bids
      .filter((bid) => bid.job !== null)
      .map((bid) => {
        const job = bid.job;
        return {
          id: job.id,
          job_title: job.job_title,
          job_description: job.job_description,
          job_photo: job.job_photo
            ? SojebStorage.url(appConfig().storageUrl.jobPhoto + job.job_photo)
            : null,
          content_length: job.content_length,
          project_budget: job.project_budget,
          job_category: job.job_category,
          project_duration: job.project_duration,
          total_payment: job.total_payment,
          status: job.status,
          created_at: job.created_at,
          updated_at: job.updated_at,
          deleted_at: job.deleted_at,
          user_id: job.user_id,
        };
      });

    return {
      success: true,
      message: 'Jobs retrieved successfully based on your bids',
      data: jobData,
    };
  }

  async findOne(id: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: {
        user: true,
        job: true,
      },
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Bid details retrieved successfully',
      data: bid,
    };
  }

  async updateBidStatus(bidId: string, updateDto: UpdateBidDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Bid exist kore kina check kora
        const bidExists = await tx.bid.findUnique({
          where: { id: bidId },
        });

        if (!bidExists) {
          throw new NotFoundException(`Bid with ID ${bidId} not found`);
        }

        // 2. Main Bid-er status update
        const updatedBid = await tx.bid.update({
          where: { id: bidId },
          data: {
            status: status as BidStatus,
            updated_at: new Date(),
          },
        });

        // 3. Jodi status 'IN_PROGRESS' hoy (Bid Accept kora hoy)
        if (status === 'IN_PROGRESS' && updatedBid.jobId) {
          // --- NOTUN LOGIC: Baki shob Bids cancel kora ---
          await tx.bid.updateMany({
            where: {
              jobId: updatedBid.jobId,
              id: { not: bidId }, // Current accept-kora bid-ta bade
              status: 'PENDING', // Sudhu pending gulo cancel korbo
            },
            data: {
              status: 'CANCELLED',
              updated_at: new Date(),
            },
          });
          // ----------------------------------------------

          const startedAt = new Date();
          let deadline = null;

          if (bidExists.req_date) {
            deadline = new Date();
            deadline.setDate(deadline.getDate() + bidExists.req_date);
          }

          // Job table update
          await tx.jOB.update({
            where: { id: updatedBid.jobId },
            data: {
              status: 'IN_PROGRESS',
              started_at: startedAt,
              deadline: deadline,
            },
          });
        }

        return {
          success: true,
          message:
            status === 'IN_PROGRESS'
              ? 'Bid accepted, other bids cancelled, and job started.'
              : `Bid status updated to ${status}`,
          data: updatedBid,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update status');
    }
  }

  async remove(id: number) {
    return `This action removes a #${id} bid`;
  }
}
