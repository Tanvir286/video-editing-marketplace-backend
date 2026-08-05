import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, JobStatus } from 'prisma/generated';
import { StringHelper } from 'src/common/helper/string.helper';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { CreateExtensionDto } from 'src/modules/application/editor/extension/dto/create-extension.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExtensionService {
  constructor(private prisma: PrismaService) {}


  /*------------------------------------------
           Create Extension Request
  ------------------------------------------*/

  async createRequest(
    userId: string,
    jobId: string,
    dto: CreateExtensionDto,
    extensionFile?: Express.Multer.File,
  ) {
  
    const data: any = {} 

    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, type: true },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    if (requester.type !== 'EDITOR') {
      throw new ForbiddenException(
        'Only Editors are allowed to request time extensions',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.jOB.findUnique({
        where: { id: jobId },
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
        throw new BadRequestException(
          'Only the editor with the accepted bid can request an extension for this job',
        );
      }

      if (job.job_status !== JobStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'Extensions can only be requested for jobs currently in progress',
        );
      }

      if (!job.job_end_date) {
        throw new BadRequestException('Job end date is missing');
      }

      const originalDate = new Date(job.job_end_date);
      if (Number.isNaN(originalDate.getTime())) {
        throw new BadRequestException('Job end date is invalid');
      }

      const newDate = new Date(originalDate);
      newDate.setDate(newDate.getDate() + Number(dto.extension_days));

      const extensionNumber = (await tx.extensionRequest.count({ where: { job_id: jobId } })) + 1;

    
      if (extensionFile) {
        const extensionFileName = `${StringHelper.randomString(10)}_${extensionFile.originalname}`;

        await SojebStorage.put(
          `${appConfig().storageUrl.extension}/${extensionFileName}`,
          extensionFile.buffer,
        );
        data.attachmentment_file = extensionFileName;
      }

      const result = await tx.extensionRequest.create({
        data: {
          job_id: jobId,
          extension_number: extensionNumber,
          message: dto.message,
          extension_days: dto.extension_days,
          original_date: originalDate,
          new_date: newDate,
          requester_id: userId,
          reviewer_id: job.user_id,
          attachmentment_file: data.attachmentment_file,
        },
      });

      return {
        success: true,
        message: 'Extension request created successfully',
        data: result,
      };
    });
  }


  /*------------------------------------------
           get my extension request list
  ------------------------------------------*/
  async getMyRequests(userId: string) {
 
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, type: true },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    if (requester.type !== 'EDITOR') {
      throw new ForbiddenException(
        'Only Editors are allowed to request time extensions',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const requests = await tx.extensionRequest.findMany({
        where: { requester_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              job_title: true,
              job_photo: true,
              job_end_date: true,
              job_status: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      const formattedRequests = requests.map((item) => {
        const currentDeliveryDate = item.original_date || item.job?.job_end_date;
        let calculatedNewDate = item.new_date;

        if (!calculatedNewDate && currentDeliveryDate) {
          const d = new Date(currentDeliveryDate);
          d.setDate(d.getDate() + item.extension_days);
          calculatedNewDate = d;
        }

        return {
          id: item.id,
          created_at: item.created_at,
          job_id: item.job_id,
          extension_number: item.extension_number,
          message: item.message,
          extension_days: item.extension_days,
          original_date: item.original_date,
          new_date: calculatedNewDate,
          current_delivery_date: currentDeliveryDate,
          new_delivery_date: calculatedNewDate,
          status: item.status,
          attachmentment_file_url: item.attachmentment_file
            ? SojebStorage.url(
                `${appConfig().storageUrl.extension}/${item.attachmentment_file}`,
              )
            : null,
          job: item.job,
        };
      });

      return {
        success: true,
        message: 'Extension requests fetched successfully',
        data: formattedRequests,
      };
    });
  }
}
