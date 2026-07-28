import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  // async createJob(
  //   userId: string,
  //   dto: CreateJobDto,
  //   files: Express.Multer.File[],
  //   jobPhoto?: Express.Multer.File,
  // ) {
  //   // 1. Initial Validation
  //   if (!files?.length) {
  //     throw new BadRequestException('At least one attachment file is required');
  //   }

  //   return this.prisma.$transaction(async (tx) => {
  //     // ⬇️ NEW: User type check logic
  //     const user = await tx.user.findUnique({
  //       where: { id: userId },
  //       select: { type: true },
  //     });

  //     if (!user || user.type !== 'CLIENT') {
  //       throw new ForbiddenException('Only clients are allowed to create jobs');
  //     }
  //     // ⬆️ End of check

  //     const attachmentPath = appConfig().storageUrl.attachment.endsWith('/')
  //       ? appConfig().storageUrl.attachment
  //       : `${appConfig().storageUrl.attachment}/`;

  //     const jobPhotoPath = appConfig().storageUrl.jobPhoto.endsWith('/')
  //       ? appConfig().storageUrl.jobPhoto
  //       : `${appConfig().storageUrl.jobPhoto}/`;

  //     // Job photo filename logic
  //     let jobPhotoName: string | null = null;
  //     if (jobPhoto) {
  //       const photoExt = jobPhoto.originalname.split('.').pop();
  //       jobPhotoName = `job-photo-${Date.now()}.${photoExt}`;

  //       await SojebStorage.put(jobPhotoPath + jobPhotoName, jobPhoto.buffer);
  //     }

  //     // Attachment processing
  //     const createdAttachments = [];
  //     for (const file of files) {
  //       const ext = file.originalname.split('.').pop();
  //       const fileName = `job-attachment-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

  //       await SojebStorage.put(attachmentPath + fileName, file.buffer);

  //       const attachment = await tx.attachment.create({
  //         data: {
  //           name: file.originalname,
  //           type: file.mimetype,
  //           size: file.size,
  //           file: fileName,
  //         },
  //       });
  //       createdAttachments.push(attachment);
  //     }

  //     // Create job
  //     const job = await tx.jOB.create({
  //       data: {
  //         ...dto,
  //         user_id: userId,
  //         job_photo: jobPhotoName,
  //         attachment: {
  //           connect: createdAttachments.map((a) => ({ id: a.id })),
  //         },
  //       },
  //       include: {
  //         attachment: true,
  //       },
  //     });

  //     return {
  //       success: true,
  //       message: 'Job created successfully',
  //       data: {
  //         ...job,
  //         job_photo_url: job.job_photo
  //           ? SojebStorage.url(jobPhotoPath + job.job_photo)
  //           : null,
  //         attachment: job.attachment.map((att) => ({
  //           ...att,
  //           file_url: att.file
  //             ? SojebStorage.url(attachmentPath + att.file)
  //             : null,
  //         })),
  //       },
  //     };
  //   });
  // }

  async createJob(
    userId: string,
    dto: CreateJobDto,
    files: Express.Multer.File[],
    jobPhoto?: Express.Multer.File,
  ) {
    // 1. Initial Validation
    if (!files?.length) {
      throw new BadRequestException('At least one attachment file is required');
    }

    // Minimum Payout Mapping (Image Table onujayi)
    const MIN_PAYOUT_MAP: Record<string, number> = {
      MIN_1_5: 5.0,
      MIN_5_10: 8.0,
      MIN_10_15: 12.0,
      MIN_15_20: 16.0,
      MIN_20_30: 20.0,
      MIN_30_40: 25.0,
      MIN_40_50: 30.0,
      MIN_50_60: 40.0,
      MIN_60_120: 30.0,
      MIN_120: 10.0,
    };

    return this.prisma.$transaction(async (tx) => {
      // 2. User type check
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { type: true },
      });

      if (!user || user.type !== 'CLIENT') {
        throw new ForbiddenException('Only clients are allowed to create jobs');
      }

      // 3. Validation Logic: Content Length vs Total Payment
      if (dto.content_length) {
        const minRequired = MIN_PAYOUT_MAP[dto.content_length];
        const userPayment = dto.total_payment || 0;

        if (userPayment < minRequired) {
          const readableLength = dto.content_length
            .replace('MIN_', '')
            .replace('_', '-');

          throw new BadRequestException(
            `For ${readableLength} minutes content, total payment must be at least $${minRequired.toFixed(2)}. Current: $${userPayment.toFixed(2)}`,
          );
        }
      }

      // --- File storage and DB Creation logic ---

      let jobPhotoName: string | null = null;
      if (jobPhoto) {
        const photoExt = jobPhoto.originalname.split('.').pop();
        jobPhotoName = `job-photo-${Date.now()}.${photoExt}`;
        await SojebStorage.put(
          appConfig().storageUrl.jobPhoto + jobPhotoName,
          jobPhoto.buffer,
        );
      }

      const createdAttachments = [];
      for (const file of files) {
        const ext = file.originalname.split('.').pop();
        const fileName = `job-attachment-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
        await SojebStorage.put(
          appConfig().storageUrl.attachment + fileName,
          file.buffer,
        );

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

      const job = await tx.jOB.create({
        data: {
          ...dto,
          user_id: userId,
          job_photo: jobPhotoName,
          attachment: {
            connect: createdAttachments.map((a) => ({ id: a.id })),
          },
        },
        include: { attachment: true },
      });

      return {
        success: true,
        message: 'Job created successfully',
        data: {
          ...job,
          job_photo_url: job.job_photo
            ? SojebStorage.url(appConfig().storageUrl.jobPhoto + job.job_photo)
            : null,
          attachment: job.attachment.map((att) => ({
            ...att,
            file_url: att.file
              ? SojebStorage.url(appConfig().storageUrl.attachment + att.file)
              : null,
          })),
        },
      };
    });
  }

  async getAllPublicJobs(params: { page: number; limit: number; q?: string }) {
    try {
      const page =
        Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
      const limit =
        Number.isFinite(params.limit) && params.limit > 0 && params.limit <= 50
          ? params.limit
          : 10;
      const skip = (page - 1) * limit;

      const where: any = {
        deleted_at: null,
        status: 'PENDING',
      };

      if (params.q?.trim()) {
        const q = params.q.trim();
        where.OR = [
          { job_title: { contains: q, mode: 'insensitive' } },
          { job_description: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [total, jobs] = await this.prisma.$transaction([
        this.prisma.jOB.count({ where }),
        this.prisma.jOB.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            job_title: true,
            total_payment: true,
            created_at: true,
            job_description: true,
            project_duration: true,
            status: true,
            job_photo: true,
            deadline: true,
          },
        }),
      ]);

      const now = new Date().getTime();

      const data = jobs.map((job) => {
        let remainingTimeMs = null;
        let isLate = false;
        let displayDuration: any = job.project_duration;

        if (job.status === 'PENDING') {
          // 1. PENDING hole: Sudhu project_duration (din) ke fixed ms format-e dekhabo
          if (job.project_duration) {
            remainingTimeMs =
              Number(job.project_duration) * 24 * 60 * 60 * 1000;
          }
          displayDuration = job.project_duration; // Fixed value (e.g., 5)
        } else if (job.status === 'IN_PROGRESS') {
          // 2. IN_PROGRESS hole: Deadline theke real-time countdown
          if (job.deadline) {
            const deadlineTime = new Date(job.deadline).getTime();
            remainingTimeMs = deadlineTime - now;

            if (remainingTimeMs < 0) {
              isLate = true;
              remainingTimeMs = 0;
            }
          }
          // In-progress e amra project_duration field-eo countdown pathai
          displayDuration = remainingTimeMs;
        }

        return {
          id: job.id,
          title: job.job_title,
          amount: job.total_payment ?? 0,
          job_description: job.job_description,
          project_duration: displayDuration,
          status: job.status,
          created_at: job.created_at,
          job_photo_url: job.job_photo
            ? SojebStorage.url(appConfig().storageUrl.jobPhoto + job.job_photo)
            : null,
          countdown: {
            remaining_ms: remainingTimeMs,
            is_late: isLate,
            deadline: job.deadline,
          },
        };
      });

      return {
        success: true,
        message: 'Jobs fetched successfully',
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch jobs',
        error: error.message,
      };
    }
  }

  //get all job by user id and status dynamically
  async getAllJobs(params: {
    page: number;
    limit: number;
    q?: string;
    status?: string;
    userId?: string;
  }) {
    try {
      const page =
        Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
      const limit =
        Number.isFinite(params.limit) && params.limit > 0 && params.limit <= 50
          ? params.limit
          : 10;
      const skip = (page - 1) * limit;

      const where: any = {
        user_id: params.userId,
        deleted_at: null,
        status: params.status || 'PENDING',
      };

      if (params.q?.trim()) {
        const q = params.q.trim();
        where.OR = [
          { job_title: { contains: q, mode: 'insensitive' } },
          { job_description: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [total, jobs] = await this.prisma.$transaction([
        this.prisma.jOB.count({ where }),
        this.prisma.jOB.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            job_title: true,
            total_payment: true,
            created_at: true,
            job_description: true,
            project_duration: true,
            status: true,
            job_photo: true,
            deadline: true,
          },
        }),
      ]);

      const now = new Date().getTime();

      const data = jobs.map((job) => {
        let remainingTimeMs = null;
        let isLate = false;
        let displayDuration: any = job.project_duration;

        if (job.status === 'PENDING') {
          // 1. PENDING hole: Sudhu project_duration (din) ke fixed ms format-e dekhabo
          if (job.project_duration) {
            remainingTimeMs =
              Number(job.project_duration) * 24 * 60 * 60 * 1000;
          }
          displayDuration = job.project_duration; // Fixed value (e.g., 5)
        } else if (job.status === 'IN_PROGRESS') {
          // 2. IN_PROGRESS hole: Deadline theke real-time countdown
          if (job.deadline) {
            const deadlineTime = new Date(job.deadline).getTime();
            remainingTimeMs = deadlineTime - now;

            if (remainingTimeMs < 0) {
              isLate = true;
              remainingTimeMs = 0;
            }
          }
          // In-progress e amra project_duration field-eo countdown pathai
          displayDuration = remainingTimeMs;
        }

        return {
          id: job.id,
          title: job.job_title,
          amount: job.total_payment ?? 0,
          job_description: job.job_description,
          project_duration: displayDuration,
          status: job.status,
          created_at: job.created_at,
          job_photo_url: job.job_photo
            ? SojebStorage.url(appConfig().storageUrl.jobPhoto + job.job_photo)
            : null,
          countdown: {
            remaining_ms: remainingTimeMs,
            is_late: isLate,
            deadline: job.deadline,
          },
        };
      });

      return {
        success: true,
        message: 'Jobs fetched successfully',
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch jobs',
        error: error.message,
      };
    }
  }

  async getSingleJob(id: string) {
    try {
      const job = await this.prisma.jOB.findFirst({
        where: { id, deleted_at: null },
        include: {
          bids: {
            where: { deleted_at: null },
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (!job) return { success: false, message: 'Job not found' };

      // Countdown Logic: Baki koto milisecond ache ta calculate kora
      let remainingTimeMs = null;
      let isLate = false;

      if (job.status === 'IN_PROGRESS' && job.deadline) {
        const now = new Date().getTime();
        const deadlineTime = new Date(job.deadline).getTime();
        remainingTimeMs = deadlineTime - now;
        if (remainingTimeMs < 0) {
          isLate = true;
          remainingTimeMs = 0; // Late hoye gele countdown 0 hobe
        }
      }

      const formattedBids = job.bids.map((b) => ({
        id: b.id,
        amount: b.amount,
        message: b.message,
        req_date: b.req_date, // Deadline bujhar jonno
        created_at: b.created_at,
        status: b.status,
        user: {
          ...b.user,
          avatar: b.user?.avatar
            ? SojebStorage.url(appConfig().storageUrl.avatar + b.user.avatar)
            : null,
        },
      }));

      return {
        success: true,
        message: 'Job fetched successfully',
        data: {
          ...job,
          job_photo: job.job_photo
            ? SojebStorage.url(appConfig().storageUrl.jobPhoto + job.job_photo)
            : null,
          bids: formattedBids,
          countdown: {
            remaining_ms: remainingTimeMs,
            is_late: isLate,
            deadline: job.deadline,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch job',
        error: error.message,
      };
    }
  }

  update(id: string, dto: UpdateJobDto) {
    const { attachments, ...jobData } = dto;

    return this.prisma.jOB.update({
      where: { id },
      data: {
        ...jobData,
        attachment: attachments
          ? {
              set: attachments.map((id) => ({ id })),
            }
          : undefined,
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.jOB.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
