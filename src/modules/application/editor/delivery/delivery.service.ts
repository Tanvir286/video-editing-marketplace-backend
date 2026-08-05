import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, DeliveryStatus, JobStatus } from 'prisma/generated';
import { StringHelper } from 'src/common/helper/string.helper';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  /*-----------------------------------
       Create Delivery (Submit Work)
  -----------------------------------*/
  async createDelivery(
    userId: string,
    createDeliveryDto: CreateDeliveryDto,
    attachmentFile?: Express.Multer.File,
  ) {
    const { job_id, message } = createDeliveryDto;

    const editor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, type: true },
    });

    if (!editor) {
      throw new NotFoundException('Editor user not found');
    }

    if (editor.type !== 'EDITOR') {
      throw new ForbiddenException(
        'Only Editors are allowed to submit job deliveries',
      );
    }

    const job = await this.prisma.jOB.findUnique({
      where: { id: job_id },
      include: {
        bids: {
          where: {
            user_id: userId,
            status: BidStatus.ACCEPTED,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!job.bids.length) {
      throw new ForbiddenException(
        'Only the editor with an accepted bid can deliver work for this job',
      );
    }

    let attachmentFileName: string | null = null;
    let originalName: string | null = null;
    let mimeType: string | null = null;
    let fileSize: number | null = null;

    if (attachmentFile) {
      originalName = attachmentFile.originalname;
      mimeType = attachmentFile.mimetype;
      fileSize = attachmentFile.size;
      attachmentFileName = `${StringHelper.randomString(10)}_${attachmentFile.originalname}`;

      await SojebStorage.put(
        `${appConfig().storageUrl.attachment}/${attachmentFileName}`,
        attachmentFile.buffer,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const delivery = await tx.jobDelivery.create({
        data: {
          job_id,
          user_id: userId,
          message,
          status: DeliveryStatus.PENDING,
          ...(attachmentFileName
            ? {
                attachments: {
                  create: {
                    name: originalName,
                    file: attachmentFileName,
                    type: mimeType,
                    size: fileSize,
                  },
                },
              }
            : {}),
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
          job: {
            select: {
              id: true,
              job_title: true,
              job_status: true,
            },
          },
        },
      });

      const formattedAttachments = delivery.attachments.map((att) => ({
        ...att,
        file_url: att.file
          ? SojebStorage.url(`${appConfig().storageUrl.attachment}/${att.file}`)
          : null,
      }));

      return {
        success: true,
        message: 'Delivery submitted successfully',
        data: {
          ...delivery,
          attachments: formattedAttachments,
        },
      };
    });
  }

  /*-----------------------------------
       Get My Deliveries (Editor)
  -----------------------------------*/
  async getMyDeliveries(userId: string) {
    const deliveries = await this.prisma.jobDelivery.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            job_title: true,
            job_photo: true,
            job_status: true,
            job_budget: true,
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
      job: d.job
        ? {
            ...d.job,
            job_photo_url: d.job.job_photo
              ? SojebStorage.url(
                  `${appConfig().storageUrl.jobPhoto}/${d.job.job_photo}`,
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
      message: 'My deliveries retrieved successfully',
      data: formattedDeliveries,
    };
  }

  /*-----------------------------------
       Get Deliveries for a Job
  -----------------------------------*/
  async getJobDeliveries(jobId: string, userId: string) {
    const job = await this.prisma.jOB.findUnique({
      where: { id: jobId },
      select: { id: true, job_title: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const deliveries = await this.prisma.jobDelivery.findMany({
      where: { job_id: jobId, user_id: userId },
      orderBy: { created_at: 'desc' },
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

    const formattedDeliveries = deliveries.map((d) => ({
      ...d,
      attachments: d.attachments.map((att) => ({
        ...att,
        file_url: att.file
          ? SojebStorage.url(`${appConfig().storageUrl.attachment}/${att.file}`)
          : null,
      })),
    }));

    return {
      success: true,
      message: 'Job deliveries retrieved successfully',
      job,
      data: formattedDeliveries,
    };
  }

  /*-----------------------------------
       Get Delivery by ID
  -----------------------------------*/
  async getDeliveryById(deliveryId: string, userId: string) {
    const delivery = await this.prisma.jobDelivery.findFirst({
      where: {
        id: deliveryId,
        user_id: userId,
      },
      include: {
        job: {
          select: {
            id: true,
            job_title: true,
            job_photo: true,
            job_status: true,
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

    if (!delivery) {
      throw new NotFoundException('Delivery record not found');
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
        attachments: formattedAttachments,
      },
    };
  }
}
