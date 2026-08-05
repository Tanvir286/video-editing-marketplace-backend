import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, ExtensionStatus, JobStatus } from 'prisma/generated';
import { CreateExtensionDto } from 'src/modules/application/editor/extension/dto/create-extension.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExtensionService {
  constructor(private prisma: PrismaService) {}

  async createRequest(userId: string, jobId: string, dto: CreateExtensionDto) {
    // const job = await this.prisma.jOB.findUnique({
    //   where: { id: jobId },
    //   include: {
    //     bids: {
    //       where: {
    //         user_id: userId,
    //         status: BidStatus.ACCEPTED,
    //       },
    //     },
    //     user: {
    //       select: { type: true },
    //     },
    //   },
    // });

    // if (!job) {
    //   throw new NotFoundException('Job not found');
    // }

    // // 3. Status Check: Job must be IN_PROGRESS
    // if (job.job_status !== JobStatus.IN_PROGRESS) {
    //   throw new BadRequestException(
    //     'Extensions can only be requested for jobs currently in progress',
    //   );
    // }

    // // User check (Assuming req.user logic)
    // const requester = await this.prisma.user.findUnique({
    //   where: { id: userId },
    // });

    // if (!requester) {
    //   throw new NotFoundException('Requester not found');
    // }

    // if (requester.type !== 'EDITOR') {
    //   throw new ForbiddenException(
    //     'Only Editors are allowed to request time extensions',
    //   );
    // }

    // // 5. Create Extension Request
    // const result = await this.prisma.extensionRequest.create({
    //   data: {
    //     job_id: jobId,
    //     message: dto.message,
    //     extension_days: dto.extension_days,
    //     original_date: job.job_deadline,
    //     user_id: userId,
    //   },
    // });

    // return {
    //   success: true,
    //   message: 'Extension request created successfully',
    //   data: result,
    // };
  }

  
}
