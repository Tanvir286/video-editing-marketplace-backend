import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import { StringHelper } from 'src/common/helper/string.helper';
import appConfig from 'src/config/app.config';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateAboutDto } from './dto/update-about.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { BidStatus, JobStatus, HireStatus } from 'prisma/generated';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  // *get full profile
  async getFullProfile(userId: string) {
 
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        country: true,
        language: true,
        avatar: true,
        about_me: true,
        skills: {
          select: {
            id: true,
            skill_name: true,
          },
        },
        protfolios: {
          select: {
            id: true,
            title: true,
            project_type: true,
            description: true,
            thumbnail: true,
          },
        },
        educations: {
          select: {
            id: true,
            course_name: true,
            subject: true,
            passing_year: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const [
      completedBiddedJobs,completedHires,reviewsAggregate] = await Promise.all([
    
          this.prisma.jOB.findMany({
            where: {
              bids: {
                some: {
                  user_id: userId,
                  status: BidStatus.ACCEPTED,
                },
              },
              status: JobStatus.COMPLETED,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          }),

          this.prisma.hire.findMany({
            where: {
              hire_profile_id: userId,
              status: HireStatus.COMPLETED,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          }),

          this.prisma.review.aggregate({
            where: {
              service_provider_id: userId,
            },
            _avg: {
              rating: true,
            },
            _count: {
              id: true,
            },
          }),

        ]);

    const rating = reviewsAggregate._avg.rating
      ? Number(reviewsAggregate._avg.rating.toFixed(1))
      : 0;
    const total_reviews = reviewsAggregate._count.id || 0;

    const formattedBiddedJobs = completedBiddedJobs.map((job) => ({
      id: job.id,
      type: 'BIDDED_JOB',
      status: job.status,
      completed_at: job.updated_at,
    }));

    const formattedHires = completedHires.map((hire) => ({
      id: hire.id,
      type: 'DIRECT_HIRE',
      status: hire.status,
      completed_at: hire.createdAt,
    }));

    const completedJobsList = [...formattedBiddedJobs, ...formattedHires].sort(
      (a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
    );

    const uniqueClientIds = new Set<string>();
    const clientProfiles: Array<{ id: string; name: string; avatar?: string | null; avatar_url: string | null }> = [];

    completedBiddedJobs.forEach((j) => {
      if (j.user?.id) uniqueClientIds.add(j.user.id);
      if (j.user?.id && j.user?.name) {
        clientProfiles.push({
          id: j.user.id,
          name: j.user.name,
          avatar: j.user.avatar,
          avatar_url: j.user.avatar
            ? SojebStorage.url(`${appConfig().storageUrl.avatar}/${j.user.avatar}`)
            : null,
        });
      }
    });

    completedHires.forEach((h) => {
      if (h.user?.id) uniqueClientIds.add(h.user.id);
      if (h.user?.id && h.user?.name) {
        clientProfiles.push({
          id: h.user.id,
          name: h.user.name,
          avatar: h.user.avatar,
          avatar_url: h.user.avatar
            ? SojebStorage.url(`${appConfig().storageUrl.avatar}/${h.user.avatar}`)
            : null,
        });
      }
    });

    const uniqueClientProfiles = clientProfiles.filter(
      (profile, index, self) =>
        index === self.findIndex((item) => item.id === profile.id),
    );

    const formatedData = (userData) => {
      return {
        id: userData.id,
        name: userData.name,
        bio: userData.bio,
        country: userData.country,
        language: userData.language,
        avatar: userData.avatar,
        avatar_url: userData.avatar ? SojebStorage.url(
              `${appConfig().storageUrl.avatar}/${userData.avatar}`,
        ): null,
        completed_jobs_count: completedJobsList.length,
        unique_clients_count: uniqueClientIds.size,
        avarage_response_time: 1,
        rating:rating,
        total_reviews:total_reviews,
        about_me: userData.about_me,
        client_profiles_you_work: uniqueClientProfiles,
        client_profiles_count: uniqueClientProfiles.length,
         protfolios: userData.protfolios?.map((portfolio) => ({
          id: portfolio.id,
          title: portfolio.title,
          project_type: portfolio.project_type,
          description: portfolio.description,
          thumbnail: portfolio.thumbnail,
          thumbnail_url: portfolio.thumbnail
            ? SojebStorage.url(
                `${appConfig().storageUrl.portfolio}/${portfolio.thumbnail}`,
              )
            : null,
        })),
        educations: userData.educations,
        skills: userData.skills,
      };
    };

    return {
      success: true,
      message: 'Profile fetched successfully',
      data: formatedData(user),
    };
  }

  // *profile info update
  async updateBasicProfile(
    userId: string,
    createProfileDto: CreateProfileDto,
    avatar?: Express.Multer.File,
  ) {
    const data: any = {};
    if (createProfileDto.name) data.name = createProfileDto.name;
    if (createProfileDto.bio) data.bio = createProfileDto.bio;
    if (createProfileDto.location) data.location = createProfileDto.location;
    if (createProfileDto.language) data.language = createProfileDto.language;

    //  image
    if (avatar) {
      const oldUser = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { avatar: true },
      });
      if (oldUser?.avatar) {
        await SojebStorage.delete(
          appConfig().storageUrl.avatar + '/' + oldUser.avatar,
        );
      }

      const fileName = `${StringHelper.randomString()}${avatar.originalname}`;
      await SojebStorage.put(
        appConfig().storageUrl.avatar + '/' + fileName,
        avatar.buffer,
      );
      data.avatar = fileName;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        bio: true,
        location: true,
        language: true,
        avatar: true,
      },
    });

    return {
      success: true,
      message: 'Basic profile updated successfully',
      data: updatedUser,
    };
  }

  // *update about me section
  async updateAbout(userId: string, updateAboutDto: UpdateAboutDto) {
    if (!updateAboutDto.about_me || updateAboutDto.about_me.trim() === '') {
      return {
        success: false,
        message: 'about_me field is required and cannot be empty',
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { about_me: updateAboutDto.about_me },
      select: { id: true, about_me: true },
    });

    return {
      success: true,
      message: 'About section updated successfully',
      data: updatedUser,
    };
  }

  // topic:protfile

  // *create portfolio
  async createPortfolio(
    userId: string,
    createPortfolioDto: CreatePortfolioDto,
    thumbnail: Express.Multer.File,
  ) {
    const { title, project_type, description } = createPortfolioDto;

    let thumbnailName: string | null = null;

    if (thumbnail) {
      thumbnailName = `${StringHelper.randomString()}${thumbnail.originalname}`;
      await SojebStorage.put(
        appConfig().storageUrl.portfolio + '/' + thumbnailName,
        thumbnail.buffer,
      );
    }

    const portfolio = await this.prisma.protfolio.create({
      data: {
        title,
        project_type,
        description,
        thumbnail: thumbnailName,
        user_id: userId,
      },
      select: {
        id: true,
        title: true,
        project_type: true,
        description: true,
        thumbnail: true,
      },
    });

    return {
      success: true,
      message: 'Portfolio created successfully',
      data: portfolio,
    };
  }

  // *update portfolio
  async updatePortfolio(
    userId: string,
    id: string,
    updatePortfolioDto: UpdatePortfolioDto,
    thumbnail?: Express.Multer.File,
  ) {
    const { title, project_type, description } = updatePortfolioDto;

    const data: any = {};
    if (title) data.title = title;
    if (project_type) data.project_type = project_type;
    if (description) data.description = description;

    if (thumbnail) {
      const oldPortfolio = await this.prisma.protfolio.findFirst({
        where: { id, user_id: userId },
        select: { thumbnail: true },
      });
      if (oldPortfolio?.thumbnail) {
        await SojebStorage.delete(
          appConfig().storageUrl.portfolio + '/' + oldPortfolio.thumbnail,
        );
      }

      const thumbnailName = `${StringHelper.randomString()}${thumbnail.originalname}`;
      await SojebStorage.put(
        appConfig().storageUrl.portfolio + '/' + thumbnailName,
        thumbnail.buffer,
      );
      data.thumbnail = thumbnailName;
    }

    const updatedPortfolio = await this.prisma.protfolio.update({
      where: { id, user_id: userId },
      data,
      select: {
        id: true,
        title: true,
        project_type: true,
        description: true,
        thumbnail: true,
      },
    });

    return {
      success: true,
      message: 'Portfolio updated successfully',
      data: updatedPortfolio,
    };
  }

  // *delete portfolio
  async deletePortfolio(userId: string, id: string) {
    const portfolio = await this.prisma.protfolio.findFirst({
      where: { id, user_id: userId },
      select: { thumbnail: true },
    });
    if (portfolio?.thumbnail) {
      await SojebStorage.delete(
        appConfig().storageUrl.portfolio + '/' + portfolio.thumbnail,
      );
    }

    await this.prisma.protfolio.delete({
      where: { id, user_id: userId },
    });

    return {
      success: true,
      message: 'Portfolio deleted successfully',
    };
  }

  // topic:education

  // *create education
  async createEducation(
    userId: string,
    createEducationDto: CreateEducationDto,
  ) {
    const { course_name, subject, passing_year } = createEducationDto;

    const education = await this.prisma.education.create({
      data: {
        course_name,
        subject,
        passing_year,
        user_id: userId,
      },
      select: {
        id: true,
        course_name: true,
        subject: true,
        passing_year: true,
      },
    });

    return {
      success: true,
      message: 'Education created successfully',
      data: education,
    };
  }

  // *update education
  async updateEducation(
    userId: string,
    id: string,
    updateEducationDto: UpdateEducationDto,
  ) {
    const { course_name, subject, passing_year } = updateEducationDto;

    const data: any = {};
    if (course_name) data.course_name = course_name;
    if (subject) data.subject = subject;
    if (passing_year) data.passing_year = passing_year;

    const updatedEducation = await this.prisma.education.update({
      where: { id, user_id: userId },
      data,
      select: {
        id: true,
        course_name: true,
        subject: true,
        passing_year: true,
      },
    });

    return {
      success: true,
      message: 'Education updated successfully',
      data: updatedEducation,
    };
  }

  // *delete education
  async deleteEducation(userId: string, id: string) {
    await this.prisma.education.delete({
      where: { id, user_id: userId },
    });

    return {
      success: true,
      message: 'Education deleted successfully',
    };
  }

  // topic:skills

  // *get all skills
  async getSkills(userId: string) {
    const skills = await this.prisma.skills.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        skill_name: true,
      },
    });
    return {
      success: true,
      message: 'Skills retrieved successfully',
      data: skills,
    };
  }

  // *create skills
  async createSkills(userId: string, dto: CreateSkillDto) {
    const result = await this.prisma.skills.create({
      data: {
        skill_name: dto.skill_name,
        user_id: userId,
      },
    });

    return {
      success: true,
      message: 'Skills created successfully',
      data: result,
    };
  }

  // *update skills
  async updateSkills(
    userId: string,
    id: string,
    updateSkillDto: UpdateSkillDto,
  ) {
    const { skill_name } = updateSkillDto;

    const data: any = {};
    if (skill_name) data.skill_name = skill_name;

    const updatedSkill = await this.prisma.skills.update({
      where: { id, user_id: userId },
      data,
      select: {
        id: true,
        skill_name: true,
      },
    });

    return {
      success: true,
      message: 'Skill updated successfully',
      data: updatedSkill,
    };
  }

  // *reviews summary
  async getReviewsSummary(userId: string) {
    const reviewCounts = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { service_provider_id: userId },
      _count: {
        rating: true,
      },
    });

    const countsByRating = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };

    reviewCounts.forEach((item) => {
      if (item.rating) countsByRating[item.rating.toString()] = item._count.rating;
    });

    const total_reviews = Object.values(countsByRating).reduce((sum, count) => sum + count, 0);

    return {
      success: true,
      message: 'Reviews summary retrieved successfully',
      data: {
        total_reviews,
        five_star: countsByRating['5'],
        four_star: countsByRating['4'],
        three_star: countsByRating['3'],
        two_star: countsByRating['2'],
        one_star: countsByRating['1'],
      },
    };
  }
  

   /*------------------------------------
            Review
   ------------------------------------*/
  


}
