import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  UserType,
  BidStatus,
  JobStatus,
  HireStatus,
} from 'prisma/generated/enums';
import { PaginationDto } from 'src/common/pagination/pagination.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

@Injectable()
export class DashboradService {
  constructor(private prisma: PrismaService) {}

  /*-----------------------------------------------------
      Total Editor & Total Client Stats API
  ------------------------------------------------------*/
  async getDashboardStatus() {
    try {
      const now = new Date();

      // Current month range (start of current month to now)
      const startOfCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );

      // Previous month range (start of last month to end of last month)
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
        0,
        0,
        0,
        0,
      );
      const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999,
      );

      // Parallel execution for optimal performance
      const [
        totalEditors,
        currentMonthEditors,
        lastMonthEditors,
        totalClients,
        currentMonthClients,
        lastMonthClients,
      ] = await Promise.all([
        // 1. Total Editors
        this.prisma.user.count({
          where: {
            type: UserType.EDITOR,
            deleted_at: null,
          },
        }),
        // Current Month Editors
        this.prisma.user.count({
          where: {
            type: UserType.EDITOR,
            deleted_at: null,
            created_at: {
              gte: startOfCurrentMonth,
              lte: now,
            },
          },
        }),
        // Last Month Editors
        this.prisma.user.count({
          where: {
            type: UserType.EDITOR,
            deleted_at: null,
            created_at: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        }),

        // 2. Total Clients
        this.prisma.user.count({
          where: {
            type: UserType.CLIENT,
            deleted_at: null,
          },
        }),
        // Current Month Clients
        this.prisma.user.count({
          where: {
            type: UserType.CLIENT,
            deleted_at: null,
            created_at: {
              gte: startOfCurrentMonth,
              lte: now,
            },
          },
        }),
        // Last Month Clients
        this.prisma.user.count({
          where: {
            type: UserType.CLIENT,
            deleted_at: null,
            created_at: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        }),
      ]);

      // Growth percentage helper
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) {
          if (current === 0) {
            return { percentage: 0, direction: 'neutral' };
          }
          return { percentage: 100, direction: 'up' };
        }
        const growth = ((current - previous) / previous) * 100;
        const percentage = Math.round(growth * 100) / 100;
        const direction =
          percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
        return { percentage: Math.abs(percentage), direction };
      };

      const editorGrowth = calculateGrowth(
        currentMonthEditors,
        lastMonthEditors,
      );
      const clientGrowth = calculateGrowth(
        currentMonthClients,
        lastMonthClients,
      );

      return {
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          total_editors: {
            total: totalEditors,
            growth_percentage: editorGrowth.percentage,
            growth_direction: editorGrowth.direction,
            this_month: currentMonthEditors,
            last_month: lastMonthEditors,
          },
          total_clients: {
            total: totalClients,
            growth_percentage: clientGrowth.percentage,
            growth_direction: clientGrowth.direction,
            this_month: currentMonthClients,
            last_month: lastMonthClients,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /*------------------------------------------------------
        Top / Total Editor List 
  ------------------------------------------------------*/
  async getTopEditors(paginationDto?: PaginationDto) {
    try {
      const page = paginationDto?.page ? Number(paginationDto.page) : 1;
      const limit = paginationDto?.limit ? Number(paginationDto.limit) : 10;
      const skip = (page - 1) * limit;

      const editors = await this.prisma.user.findMany({
        where: {
          type: UserType.EDITOR,
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          country: true,
          bio: true,
          created_at: true,
          skills: {
            select: {
              id: true,
              skill_name: true,
            },
          },
          reviewsReceived: {
            select: {
              rating: true,
            },
          },
          bids: {
            where: {
              status: BidStatus.ACCEPTED,
              job: {
                job_status: JobStatus.COMPLETED,
              },
            },
            select: {
              amount: true,
            },
          },
        },
      });

      const editorIds = editors.map((e) => e.id);

      // Fetch completed direct hires for all editors
      const completedHires = await this.prisma.hire.findMany({
        where: {
          hire_profile_id: { in: editorIds },
          status: HireStatus.COMPLETED,
        },
        select: {
          hire_profile_id: true,
          total_amount: true,
          project_budget: true,
        },
      });

      // Map hires by editor id
      const hiresByEditor = new Map<
        string,
        Array<{ total_amount: number | null; project_budget: number | null }>
      >();
      completedHires.forEach((hire) => {
        if (!hiresByEditor.has(hire.hire_profile_id)) {
          hiresByEditor.set(hire.hire_profile_id, []);
        }
        hiresByEditor.get(hire.hire_profile_id)!.push({
          total_amount: hire.total_amount,
          project_budget: hire.project_budget,
        });
      });

      // Format each editor's statistics
      const formattedEditors = editors.map((editor) => {
        const editorHires = hiresByEditor.get(editor.id) || [];

        // Calculate ratings & review counts
        const totalReviews = editor.reviewsReceived.length;
        const avgRating =
          totalReviews > 0
            ? Number(
                (
                  editor.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
                  totalReviews
                ).toFixed(1),
              )
            : 0;

        // Completed jobs count
        const completedBiddedJobsCount = editor.bids.length;
        const completedHiresCount = editorHires.length;
        const totalCompletedJobs =
          completedBiddedJobsCount + completedHiresCount;

        // Total earnings
        const biddedJobsEarnings = editor.bids.reduce(
          (sum, b) => sum + (b.amount || 0),
          0,
        );
        const hiresEarnings = editorHires.reduce(
          (sum, h) => sum + (h.total_amount || h.project_budget || 0),
          0,
        );
        const totalEarnings =
          Math.round((biddedJobsEarnings + hiresEarnings) * 100) / 100;

        return {
          id: editor.id,
          name: editor.name,
          email: editor.email,
          avatar: editor.avatar,
          avatar_url: editor.avatar
            ? SojebStorage.url(
                `${appConfig().storageUrl.avatar}/${editor.avatar}`,
              )
            : null,
          country: editor.country,
          bio: editor.bio,
          skills: editor.skills.map((s) => s.skill_name),
          rating: avgRating,
          total_reviews: totalReviews,
          completed_jobs_count: totalCompletedJobs,
          total_earnings: totalEarnings,
          joined_at: editor.created_at,
        };
      });

      // Sort by top performers: completed_jobs_count desc, rating desc, total_earnings desc
      formattedEditors.sort((a, b) => {
        if (b.completed_jobs_count !== a.completed_jobs_count) {
          return b.completed_jobs_count - a.completed_jobs_count;
        }
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.total_earnings - a.total_earnings;
      });

      const totalItems = formattedEditors.length;
      const paginatedEditors = formattedEditors.slice(skip, skip + limit);

      return {
        success: true,
        message: 'Top editors list retrieved successfully',
        pagination: {
          page,
          limit,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / limit) || 0,
        },
        data: paginatedEditors,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /*------------------------------------------------------
        Top / Total Client List 
  ------------------------------------------------------*/
  async getTopClients(paginationDto?: PaginationDto) {
    try {
      const page = paginationDto?.page ? Number(paginationDto.page) : 1;
      const limit = paginationDto?.limit ? Number(paginationDto.limit) : 10;
      const skip = (page - 1) * limit;

      const clients = await this.prisma.user.findMany({
        where: {
          type: UserType.CLIENT,
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          country: true,
          created_at: true,
          jobs: {
            select: {
              id: true,
              job_status: true,
              job_budget: true,
              job_total_payment: true,
            },
          },
          hires: {
            select: {
              id: true,
              status: true,
              project_budget: true,
              total_amount: true,
            },
          },
          payment_transactions: {
            where: {
              deleted_at: null,
              OR: [
                {
                  status: {
                    in: [
                      'completed',
                      'succeeded',
                      'paid',
                      'COMPLETED',
                      'SUCCEEDED',
                      'PAID',
                    ],
                  },
                },
                { raw_status: { in: ['succeeded', 'paid'] } },
              ],
            },
            select: {
              paid_amount: true,
              amount: true,
            },
          },
        },
      });

      const formattedClients = clients.map((client) => {
        // Jobs stats
        const totalJobs = client.jobs.length;
        const completedJobs = client.jobs.filter(
          (j) => j.job_status === JobStatus.COMPLETED,
        );
        const completedJobsCount = completedJobs.length;

        // Hires stats
        const totalHires = client.hires.length;
        const completedHires = client.hires.filter(
          (h) => h.status === HireStatus.COMPLETED,
        );
        const completedHiresCount = completedHires.length;

        // Projects counts
        const totalProjects = totalJobs + totalHires;
        const totalCompletedProjects = completedJobsCount + completedHiresCount;

        // Total spent calculation
        let totalSpent = 0;
        if (
          client.payment_transactions &&
          client.payment_transactions.length > 0
        ) {
          totalSpent = client.payment_transactions.reduce(
            (sum, tx) => sum + Number(tx.paid_amount ?? tx.amount ?? 0),
            0,
          );
        } else {
          const jobsSpent = completedJobs.reduce(
            (sum, j) => sum + (j.job_total_payment || j.job_budget || 0),
            0,
          );
          const hiresSpent = completedHires.reduce(
            (sum, h) => sum + (h.total_amount || h.project_budget || 0),
            0,
          );
          totalSpent = jobsSpent + hiresSpent;
        }
        totalSpent = Math.round(totalSpent * 100) / 100;

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          avatar: client.avatar,
          avatar_url: client.avatar
            ? SojebStorage.url(
                `${appConfig().storageUrl.avatar}/${client.avatar}`,
              )
            : null,
          country: client.country,
          total_projects: totalProjects,
          completed_projects: totalCompletedProjects,
          total_jobs_posted: totalJobs,
          total_hires: totalHires,
          total_spent: totalSpent,
          joined_at: client.created_at,
        };
      });

      // Sort by top clients: highest spent desc, most completed projects desc, most total projects desc
      formattedClients.sort((a, b) => {
        if (b.total_spent !== a.total_spent) {
          return b.total_spent - a.total_spent;
        }
        if (b.completed_projects !== a.completed_projects) {
          return b.completed_projects - a.completed_projects;
        }
        return b.total_projects - a.total_projects;
      });

      const totalItems = formattedClients.length;
      const paginatedClients = formattedClients.slice(skip, skip + limit);

      return {
        success: true,
        message: 'Top clients list retrieved successfully',
        pagination: {
          page,
          limit,
          total_items: totalItems,
          total_pages: Math.ceil(totalItems / limit) || 0,
        },
        data: paginatedClients,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }


  




}
