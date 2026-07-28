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
import { ImageGetUtil } from 'src/common/utils/image/image.util';

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

      const job = await this.prisma.jOB.findUnique({
        where: { id: jobId },
        select: { id: true },
      });

      if (!job) {
        throw new NotFoundException('Job not found with the provided jobId.');
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
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Prisma Error:', error);
      throw new BadRequestException(
        'Prisma operation failed. Check if jobId or userId is valid.',
      );
    }
  }

  // get all bids placed on a specific job
  async getBidsByJobId(jobId: string) {
    try {
      const job = await this.prisma.jOB.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      const bids = await this.prisma.bid.findMany({
      where: { jobId: jobId },
      select: {
        id: true,
        amount: true,
        req_date: true,
        message: true,
        status: true,
        created_at: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc', 
      },
    });

    const format = bids.map(item => ({
      id: item.id,
      amount: item.amount,
      req_date: item.req_date,
      message: item.message,
      status: item.status,
      created_at: item.created_at,
      user: {
        id: item.user.id,
        name: item.user.name,
        avatar: item.user.avatar,
        avatar_url:ImageGetUtil.avatarUrl(item.user.avatar)
      },
    }));

      return format;
    } catch (error) {
      console.error('Prisma Error:', error);
      throw new InternalServerErrorException('Failed to fetch bids');
    }
  }

  // delete a bid
  async deleteBid(bidId: string) {
    try {
      const bid = await this.prisma.bid.findUnique({
        where: { id: bidId },
      });

      if (!bid) {
        throw new NotFoundException('Bid not found');
      }

      await this.prisma.bid.delete({
        where: { id: bidId },
      });

      return {
        success: true,
        message: 'Bid deleted successfully',
      };
    } catch (error) {
      console.error('Prisma Error:', error);
      throw new InternalServerErrorException('Failed to delete bid');
    }
  }

  
}
