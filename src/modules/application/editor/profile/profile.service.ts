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
        location: true,
        language: true,
        avatar: true,
        about_me: true,
        skills: true,
        protfolios: true,
        educations: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const formatedData = (userData) => {
      return {
        ...userData,
        // Format avatar URL
        avatar_url: userData.avatar 
          ? SojebStorage.url(`${appConfig().storageUrl.avatar}/${userData.avatar}`)
          : null,
        // Format portfolio thumbnail URLs
        protfolios: userData.protfolios.map(portfolio => ({
          ...portfolio,
          thumbnail_url: portfolio.thumbnail
            ? SojebStorage.url(`${appConfig().storageUrl.portfolio}/${portfolio.thumbnail}`)
            : null,
        })),
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
        await SojebStorage.delete(appConfig().storageUrl.avatar + '/' + oldUser.avatar);
      }

      const fileName = `${StringHelper.randomString()}${avatar.originalname}`;
      await SojebStorage.put(appConfig().storageUrl.avatar + '/' + fileName, avatar.buffer);
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
        avatar: true },
    });

    return {
      success: true,
      message: 'Basic profile updated successfully',
      data: updatedUser,
    };
  }

  // *update about me section
  async updateAbout(
    userId: string, 
    updateAboutDto: UpdateAboutDto) {
    
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
    thumbnail: Express.Multer.File) 
    {
    const { 
      title, 
      project_type, 
      description } = createPortfolioDto;

    let thumbnailName: string | null = null;

    if (thumbnail) {
      thumbnailName = `${StringHelper.randomString()}${thumbnail.originalname}`;
      await SojebStorage.put(appConfig().storageUrl.portfolio + '/' + thumbnailName, thumbnail.buffer);
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
    userId: string, id: string, 
    updatePortfolioDto: UpdatePortfolioDto, 
    thumbnail?: Express.Multer.File) 
    {
    const {title,project_type,description} = updatePortfolioDto  

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
        await SojebStorage.delete(appConfig().storageUrl.portfolio + '/' + oldPortfolio.thumbnail);
      }

      const thumbnailName = `${StringHelper.randomString()}${thumbnail.originalname}`;
      await SojebStorage.put(appConfig().storageUrl.portfolio + '/' + thumbnailName, thumbnail.buffer);
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
      await SojebStorage.delete(appConfig().storageUrl.portfolio + '/' + portfolio.thumbnail);
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
    createEducationDto: CreateEducationDto
  ) {
   
    const { 
      course_name, 
      subject, 
      passing_year 
    } = createEducationDto;

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
    updateEducationDto: UpdateEducationDto) {

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
    updateSkillDto: UpdateSkillDto) {

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
  
  

}

