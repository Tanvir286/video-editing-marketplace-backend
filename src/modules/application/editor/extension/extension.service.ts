import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExtensionStatus } from 'prisma/generated';
import { CreateExtensionDto } from 'src/modules/application/editor/extension/dto/create-extension.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExtensionService {
  constructor(private prisma: PrismaService) {}

  async createRequest(userId: string, jobId: string, dto: CreateExtensionDto) {
    // 1. Job ebong User er status ekshathe check (Performance optimized)
    const job = await this.prisma.jOB.findUnique({
      where: { id: jobId },
      include: {
        // Assuming 'bids' table e assigned editor er information thake
        bids: {
          where: {
            user_id: userId,
            status: 'ACCEPTED', // Sudhu matro jake assign kora hoyeche
          },
        },
        // User type check korar jonno
        user: {
          select: { type: true },
        },
      },
    });

    console.log('job', job);

    // 2. Job existence check
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // 3. Status Check: Job must be IN_PROGRESS
    if (job.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Extensions can only be requested for jobs currently in progress',
      );
    }

    // 4. Role & Assignment Validation
    // User check (Assuming req.user logic)
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (requester.type !== 'EDITOR') {
      throw new ForbiddenException(
        'Only Editors are allowed to request time extensions',
      );
    }


    // 5. Create Extension Request
    const result = await this.prisma.extensionRequest.create({
      data: {
        job_id: jobId,
        message: dto.message,
        extension_days: dto.extension_days,
        original_date: job.deadline,
        user_id: userId,
      },
    });

    return {
      success: true,
      message: 'Extension request created successfully',
      data: result,
    };
  }

async processRequest(
    user_id: string,
    requestId: string,
    status: ExtensionStatus,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch request and check if current user is the job creator (Client)
      const request = await tx.extensionRequest.findUnique({
        where: { id: requestId },
        include: { 
          job: {
            include: {
              bids: { where: { status: 'IN_PROGRESS' } } 
            }
          } 
        },
      });

      if (!request) throw new NotFoundException('Extension request not found');

      // 2. Validate Ownership: request.job table theke user_id match korano
      // Logic: Sudhu matro Job creator e action nite parbe
      if (request.job.user_id !== user_id) {
        throw new ForbiddenException('You are not authorized to process this request');
      }

      // 3. Action Logic
      if (status === 'APPROVED') {
        // A. Update Job Deadline
        const new_deadline = new Date(request.original_date);
        new_deadline.setDate(new_deadline.getDate() + request.extension_days);

        await tx.jOB.update({
          where: { id: request.job_id },
          data: { deadline: new_deadline },
        });

        // B. Update Bid Duration (req_date)
        const assigned_bid = request.job.bids[0];
        if (assigned_bid) {
          await tx.bid.update({
            where: { id: assigned_bid.id },
            data: { req_date: assigned_bid.req_date + request.extension_days }
          });
        }
      }

      // 4. Final status update
      const result = await tx.extensionRequest.update({
        where: { id: requestId },
        data: { status },
      });

      return {
        success: true,
        message: `Extension request ${status.toLowerCase()} successfully`,
        data: result,
      };
    });
  }
}
