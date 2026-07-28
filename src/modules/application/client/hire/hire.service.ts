import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, Prisma } from 'prisma/generated';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { UpdateHireDto } from 'src/modules/application/client/hire/dto/update-hire.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHireDto } from './dto/create-hire.dto';

@Injectable()
export class HireService {
  constructor(private prisma: PrismaService) {}

  async createHire(
    userId: string,
    dto: CreateHireDto,
    files: Express.Multer.File[],
    projectPhoto?: Express.Multer.File,
    hireProfileId?: string,
  ) {
    const attachmentPath = appConfig().storageUrl.attachment;
    const photoPath = appConfig().storageUrl.jobPhoto;

    let projectPhotoName: string | null = null;
    if (projectPhoto) {
      const photoExt = projectPhoto.originalname.split('.').pop();
      projectPhotoName = `hire-photo-${Date.now()}.${photoExt}`;
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Photo Upload
      if (projectPhoto && projectPhotoName) {
        await SojebStorage.put(
          photoPath + projectPhotoName,
          projectPhoto.buffer,
        );
      }

      // 2. Multi-Attachments Upload
      const createdAttachments = [];
      for (const file of files) {
        const ext = file.originalname.split('.').pop();
        const fileName = `hire-att-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

        await SojebStorage.put(attachmentPath + fileName, file.buffer);

        const attachment = await tx.attachment.create({
          data: {
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            file: fileName,
          },
        });
        createdAttachments.push(attachment);
      }

      // 3. Create Hire Record
      const hire = await tx.hire.create({
        data: {
          ...dto,
          user: { connect: { id: userId } },
          project_photo: projectPhotoName,
          hire_profile_id: hireProfileId,
          attachments: {
            connect: createdAttachments.map((a) => ({ id: a.id })),
          },
        },
        include: { attachments: true, user: true },
      });

      //

      return {
        success: true,
        message: 'Hire request created successfully',
        data: this.mapUrls(hire, photoPath, attachmentPath),
      };
    });
  }

  async getAllHiresClient(params: {
    page: number;
    limit: number;
    q: string;
    status?: string;
    userId: string;
  }) {
    const { page, limit, q, status, userId } = params;
    const skip = (page - 1) * limit;

    try {
      const where: Prisma.HireWhereInput = {
        user_id: userId,
      };

      if (q) {
        where.OR = [
          { project_title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (status && Object.values(JobStatus).includes(status as JobStatus)) {
        where.status = status as JobStatus;
      }

      const [hires, total] = await Promise.all([
        this.prisma.hire.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.hire.count({ where }),
      ]);

      const photoPath = appConfig().storageUrl.jobPhoto;

      return {
        success: true,
        message: 'Client hire records fetched successfully',
        data: hires.map((hire) => ({
          id: hire.id,
          project_title: hire.project_title,
          video_duration: hire.video_duration,
          project_budget: hire.project_budget,
          project_duration: hire.project_duration,
          user_id: hire.user_id,
          project_photo_url: hire.project_photo
            ? SojebStorage.url(photoPath + hire.project_photo)
            : null,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching client hires:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getAllHiresEditor(params: {
    page: number;
    limit: number;
    q: string;
    status?: string;
    userId: string;
  }) {
    const { page, limit, q, status, userId } = params;
    const skip = (page - 1) * limit;

    try {
      const where: Prisma.HireWhereInput = {
        hire_profile_id: userId,
      };

      if (q) {
        where.OR = [
          { project_title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (status && Object.values(JobStatus).includes(status as JobStatus)) {
        where.status = status as JobStatus;
      }

      const [hires, total] = await Promise.all([
        this.prisma.hire.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.hire.count({ where }),
      ]);

      const photoPath = appConfig().storageUrl.jobPhoto;

      const formattedData = hires.map((hire) => {
        // --- Countdown Logic for List ---
        let remaining_time_formatted = '0d 0h 0m 0s';
        let remaining_time_ms = 0;

        const durationInDays = Number(hire.project_duration) || 0;
        const durationInMs = durationInDays * 24 * 60 * 60 * 1000;

        if (hire.status === 'IN_PROGRESS' && hire.startedAt) {
          const startedTime = new Date(hire.startedAt).getTime();
          const deadline = startedTime + durationInMs;
          const now = Date.now();
          remaining_time_ms = Math.max(0, deadline - now);
        } else if (hire.status === 'PENDING') {
          remaining_time_ms = durationInMs;
        } else if (hire.status === 'CANCEL' || hire.status === 'LATE') {
          remaining_time_ms = 0;
        }

        // Formatting
        if (remaining_time_ms > 0) {
          const days = Math.floor(remaining_time_ms / (24 * 60 * 60 * 1000));
          const hours = Math.floor(
            (remaining_time_ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
          );
          const minutes = Math.floor(
            (remaining_time_ms % (60 * 60 * 1000)) / (60 * 1000),
          );
          const seconds = Math.floor((remaining_time_ms % (60 * 1000)) / 1000);
          remaining_time_formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        return {
          id: hire.id,
          project_title: hire.project_title,
          video_duration: hire.video_duration,
          project_budget: hire.project_budget,
          project_duration: hire.project_duration,
          user_id: hire.user_id,
          status: hire.status,
          remaining_time_formatted,
          project_photo_url: hire.project_photo
            ? SojebStorage.url(
                appConfig().storageUrl.jobPhoto + hire.project_photo,
              )
            : null,
        };
      });

      return {
        success: true,
        message: 'Editor hire records fetched successfully',
        data: formattedData,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching editor hires:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async getHireById(id: string) {
    const hire = await this.prisma.hire.findUnique({
      where: { id },
      include: {
        attachments: true,
      },
    });

    if (!hire) throw new NotFoundException('Hire record not found');

    const mappedHire = this.mapUrls(
      hire,
      appConfig().storageUrl.jobPhoto,
      appConfig().storageUrl.attachment,
    );

    // --- Countdown Logic ---
    let deadline = null;
    let remaining_time_ms = 0;
    let remaining_time_formatted = '0d 0h 0m 0s';

    const durationInDays = Number(mappedHire.project_duration) || 0;
    const durationInMs = durationInDays * 24 * 60 * 60 * 1000;

    if (mappedHire.status === 'IN_PROGRESS' && mappedHire.startedAt) {
      const startedTime = new Date(mappedHire.startedAt).getTime();
      deadline = new Date(startedTime + durationInMs);
      const now = Date.now();
      remaining_time_ms = Math.max(0, deadline.getTime() - now);
    } else if (mappedHire.status === 'PENDING') {
      remaining_time_ms = durationInMs;
    } else if (mappedHire.status === 'CANCEL' || mappedHire.status === 'LATE') {
      remaining_time_ms = 0;
    }

    if (remaining_time_ms > 0) {
      const days = Math.floor(remaining_time_ms / (24 * 60 * 60 * 1000));
      const hours = Math.floor(
        (remaining_time_ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
      );
      const minutes = Math.floor(
        (remaining_time_ms % (60 * 60 * 1000)) / (60 * 1000),
      );
      const seconds = Math.floor((remaining_time_ms % (60 * 1000)) / 1000);
      remaining_time_formatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    const data = {
      id: mappedHire.id,
      project_title: mappedHire.project_title,
      video_category: mappedHire.video_category,
      project_photo: mappedHire.project_photo,
      project_photo_url: mappedHire.project_photo
        ? SojebStorage.url(
            appConfig().storageUrl.jobPhoto + mappedHire.project_photo,
          )
        : null,
      video_duration: mappedHire.video_duration,
      description: mappedHire.description,
      project_budget: mappedHire.project_budget,
      project_duration: mappedHire.project_duration,
      total_amount: mappedHire.total_amount,
      hire_profile_id: mappedHire.hire_profile_id,
      user_id: mappedHire.user_id,
      status: mappedHire.status,
      started_at: mappedHire.startedAt,
      deadline: deadline,
      // remaining_time_ms: remaining_time_ms,
      remaining_time_formatted: remaining_time_formatted,
      software_preference: mappedHire.software_preference,
      createdAt: mappedHire.createdAt,
      updatedAt: mappedHire.updatedAt,

      attachments: mappedHire.attachments.map((att) => ({
        id: att.id,
        file: att.file_url,
      })),

      user: mappedHire.user,
    };

    return {
      success: true,
      message: 'Hire record fetched successfully',
      data: data,
    };
  }

  async updateStatus(id: string, updateHireDto: UpdateHireDto) {
    const updatedHire = await this.prisma.hire.update({
      where: { id },
      data: {
        ...updateHireDto,
        status: updateHireDto.status,
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Hire status updated successfully',
      data: updatedHire,
    };
  }

  private mapUrls(hire: any, photoPath: string, attPath: string) {
    const mappedHire = {
      ...hire,
      project_photo_url: hire.projectPhoto
        ? SojebStorage.url(photoPath + hire.projectPhoto)
        : null,
      attachments: hire.attachments?.map((att) => ({
        ...att,
        file_url: att.file ? SojebStorage.url(attPath + att.file) : null,
      })),
    };
    return mappedHire;
  }
}
