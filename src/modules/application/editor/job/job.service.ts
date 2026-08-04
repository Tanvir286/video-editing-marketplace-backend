import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { calculateSkillMatch } from 'src/common/utils/skill-matcher.util';
import { ImageGetUtil } from 'src/common/utils/image/image.util';
import { EditorJobPaginationDto } from './dto/pagination-job.dto';
import { BidStatus, JobStatus, Prisma } from 'prisma/generated';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  /*--------------------------------------------------
      My Jobs  (All/pending/completed/cancel/others)
  --------------------------------------------------*/

  async myJobs(paginationDto: EditorJobPaginationDto, editorId: string) {
   
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;

    console.log(editorId)

    const jobWhere: any = {
      bids: {
        some: {
          user_id: editorId,
          status: BidStatus.ACCEPTED,
        },
      },
    };

    const hireWhere: any = {
      hire_profile_id: editorId,
    };

    if (paginationDto?.status) {
      jobWhere.job_status = paginationDto.status;
      hireWhere.status = paginationDto.status;
    }

    // Get total count and data
    const [jobs, hires] = await Promise.all([
      // job data
      this.prisma.jOB.findMany({
        where: jobWhere,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          job_title: true,
          job_photo: true,
          job_duration: true,
          job_deadline: true,
          job_status: true,
          created_at: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              country: true,
              avatar: true,
            },
          },
          bids: {
            where: {
              user_id: editorId,
              status: BidStatus.ACCEPTED,
            },
            select: {
              id: true,
              amount: true,
              req_date: true,
              message: true,
              status: true,
              created_at: true,
            },
          },
        },
      }),

      // Get hires
      this.prisma.hire.findMany({
        where: hireWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          project_title: true,
          project_photo: true,
          project_duration: true,
          total_amount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const formattedJob = jobs.map((job) => {
      return {
        id: job.id,
        created_at: job.created_at,
        job_title: job.job_title,
        job_photo: job.job_photo,
        job_photo_url: ImageGetUtil.jobPhotoUrl(job.job_photo),
        project_duration: job.job_duration,
        status: job.job_status,
        bid: job.bids?.[0]?.amount ?? null,
        deadline: job.job_deadline,
        format:"job",
      };
    });

    const formattedHires = hires.map((hire) => {
      return {
        id: hire.id,
        created_at: hire.createdAt,
        project_title: hire.project_title,
        project_photo: hire.project_photo,
        project_photo_url: ImageGetUtil.jobPhotoUrl(hire.project_photo),
        project_duration: hire.project_duration,
        status: hire.status,
        total_amount: hire.total_amount,
        format:"hire",
      };
    });

    // ✅ Combine both arrays
    let allItems = [...formattedJob, ...formattedHires];

    // ✅ Sort by created_at (newest first)
    allItems.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // ✅ Apply pagination after combining
    const total = allItems.length;
    const paginatedData = allItems.slice(skip, skip + limit);

    return {
      success: true,
      message: 'My jobs and hires retrieved successfully',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        ...(paginationDto?.status && { filter_status: paginationDto.status }),
      },
      data: paginatedData,
      meta: {
        job_count: formattedJob.length,
        hire_count: formattedHires.length,
      },
    };
  }

  /*-------------------------------------------------------
                  get all jobs pending job
  -------------------------------------------------------*/

  async quickMatch(paginationDto: PaginationDto, editorId: string) {
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;

    const editor = await this.prisma.user.findUnique({
      where: { id: editorId },
      select: { skills: { select: { skill_name: true } } },
    });

    const editorSkills = (editor?.skills ?? []).map((s) =>
      s.skill_name.toLowerCase().trim(),
    );

    console.log(editorSkills, editorId);

    const jobs = await this.prisma.jOB.findMany({
      where: { job_status: JobStatus.PENDING },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        job_title: true,
        job_description: true,
        job_total_payment: true,
        job_duration: true,
        job_status: true,
        created_at: true,
        job_skill: true,
        job_deadline: true,
        job_photo: true,
        user: {
          select: {
            id: true,
            created_at: true,
            first_name: true,
            avatar: true,
            last_name: true,
            country: true,
            skills: { select: { skill_name: true } },
          },
        },
      },
    });

    const formattedAndMatchedJobs = jobs.map((job) => ({
      id: job.id,
      job_title: job.job_title,
      job_photo: job.job_photo,
      job_photo_url: ImageGetUtil.jobPhotoUrl(job.job_photo),
      user_name:
        `${job.user?.first_name ?? ''} ${job.user?.last_name ?? ''}`.trim(),
      user_photo: job.user?.avatar,
      user_photo_url: ImageGetUtil.avatarUrl(job.user?.avatar),
      skill: job.job_skill,
      exprience: job.user?.created_at ?? null,
      location: job.user?.country ?? null,
      total_payment: job.job_total_payment,
      project_duration: job.job_duration,
      match_percentage: calculateSkillMatch(job.job_skill, editorSkills),
    }));

    formattedAndMatchedJobs.sort(
      (a, b) => b.match_percentage - a.match_percentage,
    );

    const total = formattedAndMatchedJobs.length;
    const paginatedData = formattedAndMatchedJobs.slice(skip, skip + limit);

    return {
      success: true,
      message: 'Pending jobs fetched successfully with fuzzy match',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: paginatedData,
    };
  }

  /*-------------------------------------------------------
                  browse jobs pending job
  -------------------------------------------------------*/

  async browseJobs(paginationDto: PaginationDto) {
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.JOBWhereInput = {
      job_status: JobStatus.PENDING,
    };

    const [total, jobs] = await this.prisma.$transaction([
      this.prisma.jOB.count({ where }),
      this.prisma.jOB.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          created_at: true,
          job_title: true,
          job_total_payment: true,
          job_duration: true,
          job_status: true,
          job_skill: true,
          job_photo: true,
          job_content_length: true,
          job_style_reference: true,
          job_pdf: true,
          job_platform: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar: true,
              country: true,
              created_at: true,
            },
          },
        },
      }),
    ]);

    const formatData = jobs.map((job) => ({
      id: job.id,
      created_at: job.created_at,
      job_title: job.job_title,
      total_payment: job.job_total_payment,
      project_duration: job.job_duration,
      content_length: job.job_content_length,
      status: job.job_status,
      job_photo: job.job_photo,
      job_photo_url: ImageGetUtil.jobPhoto(job.job_photo),
      job_style_reference: job.job_style_reference,
      job_pdf: job.job_pdf,
      job_platform: job.job_platform,
      skill: job.job_skill,
      user_name: job.user?.first_name ?? null,
      user_location: job.user?.country ?? null,
      user_photo: job.user?.avatar ?? null,
      user_photo_url: ImageGetUtil.avatar(job.user?.avatar),
    }));

    return {
      success: true,
      message: 'Pending jobs fetched successfully',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: formatData,
    };
  }

  /*--------------------------------------------------
              get job details
  --------------------------------------------------*/

  async getJobDetails(jobId: string, paginationDto?: PaginationDto) {
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;

    const job = await this.prisma.jOB.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        job_title: true,
        job_description: true,
        job_photo: true,
        job_category: true,
        job_budget: true,
        job_platform: true,
        job_duration: true,
        job_skill: true,
        job_content_length: true,
        job_style_reference: true,
        job_pdf: true,
        job_documentation: true,
        job_deadline: true,
        job_total_payment: true,
        job_status: true,
        created_at: true,
        updated_at: true,
        job_startedat: true,
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
            language: true,
            country: true,
            created_at: true,
            skills: {
              select: {
                skill_name: true,
              },
            },
          },
        },
        bids: {
          select: {
            id: true,
            status: true,
            message: true,
            created_at: true,
            user: {
              select: {
                id: true,
                avatar: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const jobData = job as any;
    const attachmentsCount = jobData.attachments?.length ?? 0;

    return {
      success: true,
      message: 'Job details retrieved successfully',
      data: {
        id: job.id,
        job_category: job.job_category,
        project_budget: jobData.job_budget,
        platform: jobData.job_platform,
        project_duration: jobData.job_duration,
        content_length: jobData.job_content_length,
        country: jobData.user?.country ?? null,
        job_title: jobData.job_title,
        job_description: jobData.job_description,
        job_photo_url: ImageGetUtil.jobPhotoUrl(jobData.job_photo),
        skill: jobData.job_skill,
        attachment:{
          style: jobData.job_style_reference ? ImageGetUtil.jobPhotoUrl(jobData.job_style_reference) : null,
          pdf: jobData.job_pdf ? ImageGetUtil.jobPhotoUrl(jobData.job_pdf) : null,
          documentation: jobData.job_documentation ? ImageGetUtil.jobPhotoUrl(jobData.job_documentation) : null,
        },
        bids: (jobData.bids ?? []).map((bid: any) => ({
          id: bid.id,
          status: bid.status,
          message: bid.message,
          created_at: bid.created_at,
          avatar: bid.user?.avatar ?? null,
          avatar_url: ImageGetUtil.avatarUrl(bid.user?.avatar),
          bidder_name:
            `${bid.user?.first_name ?? ''} ${bid.user?.last_name ?? ''}`.trim(),
        })),
        buyer_info: {
          user_name:
            `${jobData.user?.first_name ?? ''} ${jobData.user?.last_name ?? ''}`.trim(),
          user_photo_url: ImageGetUtil.avatarUrl(jobData.user?.avatar),
          user_location: jobData.user?.country ?? null,
          user_language: jobData.user?.language ?? null,
        },
      },
    };
  }

  /*--------------------------------------------------
               hire request
  --------------------------------------------------*/
}
