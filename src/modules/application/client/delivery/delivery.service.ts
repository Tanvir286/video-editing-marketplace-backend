import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, JobStatus } from 'prisma/generated';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  /*-----------------------------------
       Get Job Deliveries (Client)
  -----------------------------------*/
  async getJobDeliveries(jobId: string, userId: string) {
    const job = await this.prisma.jOB.findFirst({
      where: {
        id: jobId,
        user_id: userId,
      },
      select: {
        id: true,
        job_title: true,
        job_status: true,
      },
    });

    if (!job) {
      throw new NotFoundException(
        'Job not found or you are not authorized to view deliveries for this job',
      );
    }

    const deliveries = await this.prisma.jobDelivery.findMany({
      where: { job_id: jobId },
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        attachments: {
          select: {
            id: true,
            name: true,
            file: true,
            type: true,
            size: true,
          },
        },
      },
    });

    const formattedDeliveries = deliveries.map((d) => ({
      ...d,
      user: d.user
        ? {
            ...d.user,
            avatar_url: d.user.avatar
              ? SojebStorage.url(
                  `${appConfig().storageUrl.avatar}/${d.user.avatar}`,
                )
              : null,
          }
        : null,
      attachments: d.attachments.map((att) => ({
        ...att,
        file_url: att.file
          ? SojebStorage.url(`${appConfig().storageUrl.attachment}/${att.file}`)
          : null,
      })),
    }));

    return {
      success: true,
      message: 'Deliveries retrieved successfully',
      job,
      data: formattedDeliveries,
    };
  }

  /*-----------------------------------
       Update Delivery Status (Accept / Reject / Request Revision)
  -----------------------------------*/
  async updateDeliveryStatus(
    deliveryId: string,
    userId: string,
    dto: UpdateDeliveryStatusDto,
  ) {
    const { status, message } = dto;

    const delivery = await this.prisma.jobDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        job: {
          select: {
            id: true,
            user_id: true,
            job_status: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery record not found');
    }

    if (!delivery.job || delivery.job.user_id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to process this delivery',
      );
    }

    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException(
        `This delivery has already been ${delivery.status.toLowerCase()}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.jobDelivery.update({
        where: { id: deliveryId },
        data: {
          status,
          ...(message ? { message } : {}),
        },
        include: {
          attachments: {
            select: {
              id: true,
              name: true,
              file: true,
              type: true,
              size: true,
            },
          },
        },
      });

      if (status === DeliveryStatus.ACCEPTED) {
        await tx.jOB.update({
          where: { id: delivery.job_id },
          data: {
            job_status: JobStatus.COMPLETED,
            job_completed_date: new Date(),
          },
        });
      } else if (status === DeliveryStatus.REVISION_REQUESTED) {
        await tx.jOB.update({
          where: { id: delivery.job_id },
          data: {
            job_status: JobStatus.IN_PROGRESS,
          },
        });
      }

      const formattedAttachments = updatedDelivery.attachments.map((att) => ({
        ...att,
        file_url: att.file
          ? SojebStorage.url(`${appConfig().storageUrl.attachment}/${att.file}`)
          : null,
      }));

      return {
        success: true,
        message: `Delivery ${status.toLowerCase()} successfully`,
        data: {
          ...updatedDelivery,
          attachments: formattedAttachments,
        },
      };
    });
  }

  /*-----------------------------------
       Get Delivery Details by ID (Client)
  -----------------------------------*/
  async getDeliveryById(deliveryId: string, userId: string) {
    const delivery = await this.prisma.jobDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        job: {
          select: {
            id: true,
            job_title: true,
            user_id: true,
            job_status: true,
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
        attachments: {
          select: {
            id: true,
            name: true,
            file: true,
            type: true,
            size: true,
          },
        },
      },
    });

    if (!delivery || delivery.job?.user_id !== userId) {
      throw new NotFoundException(
        'Delivery record not found or access denied',
      );
    }

    const formattedAttachments = delivery.attachments.map((att) => ({
      ...att,
      file_url: att.file
        ? SojebStorage.url(`${appConfig().storageUrl.attachment}/${att.file}`)
        : null,
    }));

    return {
      success: true,
      message: 'Delivery details retrieved successfully',
      data: {
        ...delivery,
        user: delivery.user
          ? {
              ...delivery.user,
              avatar_url: delivery.user.avatar
                ? SojebStorage.url(
                    `${appConfig().storageUrl.avatar}/${delivery.user.avatar}`,
                  )
                : null,
            }
          : null,
        attachments: formattedAttachments,
      },
    };
  }
}
