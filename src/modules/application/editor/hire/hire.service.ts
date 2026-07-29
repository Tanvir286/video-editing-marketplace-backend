import { Injectable } from '@nestjs/common';
import { CreateHireDto } from './dto/create-hire.dto';
import { UpdateHireDto } from './dto/update-hire.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { HireStatus } from 'prisma/generated';
import { ImageGetUtil } from 'src/common/utils/image/image.util';
import { HirePaginationDto } from './dto/pagination-hire.dto';

@Injectable()
export class HireService {
  constructor(private readonly prisma: PrismaService) {}

  // get hire request
  async getHireRequest(
    paginationDto: HirePaginationDto, 
    editorId: string,
    status?: HireStatus 
  ) {
    const page = paginationDto?.page ?? 1;
    const limit = paginationDto?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {
      hire_profile_id: editorId,
    };

    if (status) {
      where.status = status;
    }

    const [total, hireRequests] = await this.prisma.$transaction([
      this.prisma.hire.count({ where }),
      this.prisma.hire.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          project_title: true,
          project_photo: true,
          project_budget: true,
          project_duration: true,
          status: true,
        },
      }),
    ]);

    const formatData = hireRequests.map((request) => ({
      id: request.id,
      project_title: request.project_title,
      project_budget: request.project_budget,
      project_duration: request.project_duration,
      status: request.status,
      project_photo: request.project_photo,
      project_photo_url: ImageGetUtil.jobPhoto(request.project_photo),
    }));

    return {
      success: true,
      message: 'Hire requests fetched successfully',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: formatData,
    };
  }
}