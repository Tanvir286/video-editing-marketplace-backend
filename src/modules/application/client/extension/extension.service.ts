import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { ExtensionStatus } from 'prisma/generated';
import { ApproveOrRejectJobExtensionDto } from './dto/approve-or-reject-job-extension.dto';

@Injectable()
export class ExtensionService {
  constructor(private prisma: PrismaService) {}
 
  /*-----------------------------------
       job id wise extension list
  -----------------------------------*/
  async findJob(jobId: string, userId: string) {
    const job = await this.prisma.jOB.findFirst({
      where: {
        id: jobId,
        user_id: userId,
      },
      select: {
        id: true,
        job_title: true,
        job_deadline: true,
        job_end_date: true,
      },
    });

    if (!job) {
      throw new NotFoundException(
        'Job not found or you are not authorized to view this job',
      );
    }

    const extensionRequests = await this.prisma.extensionRequest.findMany({
      where: { job_id: jobId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        extension_number: true,
        message: true,
        attachmentment_file: true,
        extension_days: true,
        original_date: true,
        new_date: true,
        status: true,
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const formattedRequests = extensionRequests.map((req) => {
     
      const currentDeliveryDate = req.original_date || job.job_end_date;
      let calculatedNewDate = req.new_date;

      if (!calculatedNewDate && currentDeliveryDate) {
        const d = new Date(currentDeliveryDate);
        d.setDate(d.getDate() + req.extension_days);
        calculatedNewDate = d;
      }

      return {
        ...req,
        current_delivery_date: currentDeliveryDate,
        new_delivery_date: calculatedNewDate,
        attachmentment_file_url: req.attachmentment_file
          ? SojebStorage.url(
              `${appConfig().storageUrl.extension}/${req.attachmentment_file}`,
            )
          : null,
        requester: req.requester
          ? {
              ...req.requester,
              avatar_url: req.requester.avatar
                ? SojebStorage.url(
                    `${appConfig().storageUrl.avatar}/${req.requester.avatar}`,
                  )
                : null,
            }
          : null,
      };
    });

    return {
      success: true,
      message: 'Extension requests retrieved successfully',
      job: {
        id: job.id,
        job_title: job.job_title,
        job_deadline: job.job_deadline,
        job_end_date: job.job_end_date,
      },
      data: formattedRequests,
    };
  }

  /*-----------------------------------
     approve or reject job extension
  -----------------------------------*/
  async approveOrReject(
    extensionId: string,
    userId: string,
    dto: ApproveOrRejectJobExtensionDto,
  ) {
    const { status } = dto;

    if (
      status !== ExtensionStatus.APPROVED &&
   status !== ExtensionStatus.REJECTED
    ) {
      throw new BadRequestException('Status must be APPROVED or REJECTED');
    }

    return this.prisma.$transaction(async (tx) => {

      const extensionRequest = await tx.extensionRequest.findUnique({
        where: { id: extensionId },
        include: {
          job: {
            select: {
              id: true,
              user_id: true,
              job_end_date: true,
            },
          },
        },
      });

      if (!extensionRequest) {
        throw new NotFoundException('Extension request not found');
      }

      if (!extensionRequest.job || extensionRequest.job.user_id !== userId) {
        throw new ForbiddenException(
          'You are not authorized to update this extension request',
        );
      }

      if (extensionRequest.status !== ExtensionStatus.PENDING) {
        throw new BadRequestException(
          `This extension request has already been ${extensionRequest.status.toLowerCase()}`,
        );
      }

      let newDate = extensionRequest.new_date;
      if (status === ExtensionStatus.APPROVED) {
        const baseDate =
          extensionRequest.original_date || extensionRequest.job.job_end_date;
        if (!newDate && baseDate) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + extensionRequest.extension_days);
          newDate = d;
        }
      }

     
      const updatedRequest = await tx.extensionRequest.update({
        where: { id: extensionId },
        data: {
          status,
          reviewer_id: userId,
          ...(status === ExtensionStatus.APPROVED && newDate
            ? { new_date: newDate }
            : {}),
        },
      });

      if (status === ExtensionStatus.APPROVED && newDate) {
        await tx.jOB.update({
          where: { id: extensionRequest.job_id },
          data: {
            job_end_date: newDate,
          },
        });
      }

  
      return {
        success: true,
        message: `Extension request ${status.toLowerCase()} successfully`,
        data: updatedRequest,
      };
    });
  }
}
