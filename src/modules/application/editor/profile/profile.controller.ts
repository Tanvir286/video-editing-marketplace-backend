import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateAboutDto } from './dto/update-about.dto';
import { use } from 'passport';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';
import { UpdateSkillDto } from './dto/update-skill.dto';

@ApiTags('**Editor Profile**')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth(USER_TYPES.EDITOR)
@Controller('editor/profile')
export class ProfileController {
  
  constructor(private readonly profileService: ProfileService) {}

  // *get full profile
  @Get()
  @ApiOperation({
    summary: 'Get full profile',
    description: 'Retrieve the authenticated editor profile with skills, portfolios, and educations.',
  })
  @ApiOkResponse({
    description: 'Profile fetched successfully',
    schema: {
      example: {
        success: true,
        message: 'Profile fetched successfully',
        data: {
          id: 'user-id-123',
          name: 'John Doe',
          bio: 'Short bio',
          location: 'Dhaka',
          language: 'Bangla',
          avatar: 'avatar-file.png',
          avatar_url: 'https://example.com/avatar/avatar-file.png',
          about_me: 'About me text',
          skills: [],
          protfolios: [],
          educations: [],
        },
      },
    },
  })
  async getProfile(
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return await this.profileService.getFullProfile(userId);
  }


  // *profile info update 
  @Patch('profile-info')
  @ApiOperation({
    summary: 'Update basic profile info',
    description: 'Update editor name, bio, location, language, and optional avatar image.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        bio: { type: 'string', example: 'Creative video editor' },
        location: { type: 'string', example: 'Dhaka' },
        language: { type: 'string', example: 'Bangla' },
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Basic profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Basic profile updated successfully',
        data: {
          id: 'user-id-123',
          name: 'John Doe',
          bio: 'Creative video editor',
          location: 'Dhaka',
          language: 'Bangla',
          avatar: 'avatar-file.png',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateBasicInfo(
    @Req() req: any,
    @Body() createProfileDto: CreateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const userId = req.user.userId;
    return await this.profileService.updateBasicProfile(userId, createProfileDto, avatar);
  }



  //  * update  about me section
  @Patch('about-me')
  @ApiOperation({
    summary: 'Update about me',
    description: 'Update the about me section of the editor profile.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        about_me: { type: 'string', example: 'I edit videos for brands and creators.' },
      },
      required: ['about_me'],
    },
  })
  @ApiOkResponse({
    description: 'About section updated successfully',
    schema: {
      example: {
        success: true,
        message: 'About section updated successfully',
        data: {
          id: 'user-id-123',
          about_me: 'I edit videos for brands and creators.',
        },
      },
    },
  })
  async updateAboutMe(
    @Req() req: any,
    @Body() updateAboutDto: UpdateAboutDto,
  ) {
    const userId = req.user.userId;
    return await this.profileService.updateAbout(userId, updateAboutDto);
  }

  // topic:protfile 

  // *create portfolio
  @Post('portfolio')
  @ApiOperation({
    summary: 'Create portfolio',
    description: 'Create a portfolio item with an optional thumbnail upload.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Promo Video' },
        project_type: { type: 'string', example: 'Commercial' },
        description: { type: 'string', example: 'A short promotional edit.' },
        thumbnail: { type: 'string', format: 'binary' },
      },
      required: ['title', 'project_type', 'description'],
    },
  })
  @ApiOkResponse({
    description: 'Portfolio created successfully',
    schema: {
      example: {
        success: true,
        message: 'Portfolio created successfully',
        data: {
          id: 'portfolio-id-123',
          title: 'Promo Video',
          project_type: 'Commercial',
          description: 'A short promotional edit.',
          thumbnail: 'thumbnail-file.png',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async createPortfolio(
    @Req() req: any,
    @Body() createPortfolioDto: CreatePortfolioDto,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {

    if (!thumbnail) {
      throw new BadRequestException('Thumbnail file is required');
    }

    const userId = req.user.userId;
    return await this.profileService.createPortfolio(
      userId,
      createPortfolioDto,
      thumbnail,
    );
  }

  // *update portfolio
  @Patch('portfolio/:id')
  @ApiOperation({
    summary: 'Update portfolio',
    description: 'Update a portfolio item and optionally replace its thumbnail.',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID', example: 'portfolio-id-123' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated promo video' },
        project_type: { type: 'string', example: 'Commercial' },
        description: { type: 'string', example: 'Updated description.' },
        thumbnail: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Portfolio updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Portfolio updated successfully',
        data: {
          id: 'portfolio-id-123',
          title: 'Updated promo video',
          project_type: 'Commercial',
          description: 'Updated description.',
          thumbnail: 'thumbnail-file.png',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updatePortfolio(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    const userId = req.user.userId;
    return await this.profileService.updatePortfolio(
      userId,
      id,
      updatePortfolioDto,
      thumbnail,
    );
  }

  // *delete portfolio
  @Delete('portfolio/:id')
  @ApiOperation({
    summary: 'Delete portfolio',
    description: 'Delete a portfolio item by id.',
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID', example: 'portfolio-id-123' })
  @ApiOkResponse({
    description: 'Portfolio deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Portfolio deleted successfully',
      },
    },
  })
  async deletePortfolio(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId = req.user.userId;
    return await this.profileService.deletePortfolio(userId, id);
  }

  // topic:education

  // *create education
  @Post('education')
  @ApiOperation({
    summary: 'Create education',
    description: 'Create a new education entry for the profile.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        course_name: { type: 'string', example: 'BSc in CSE' },
        subject: { type: 'string', example: 'Computer Science' },
        passing_year: { type: 'string', example: '2024' },
      },
      required: ['course_name', 'subject', 'passing_year'],
    },
  })
  @ApiOkResponse({
    description: 'Education created successfully',
    schema: {
      example: {
        success: true,
        message: 'Education created successfully',
        data: {
          id: 'education-id-123',
          course_name: 'BSc in CSE',
          subject: 'Computer Science',
          passing_year: '2024',
        },
      },
    },
  })
  async createEducation(
    @Req() req: any,
    @Body() createEducationDto: CreateEducationDto,
  ) {
    const userId = req.user.userId;
    return await this.profileService.createEducation(
      userId, 
      createEducationDto);
  }
  
  // *update education
  @Patch('education/:id')
  @ApiOperation({
    summary: 'Update education',
    description: 'Update an existing education entry.',
  })
  @ApiParam({ name: 'id', description: 'Education ID', example: 'education-id-123' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        course_name: { type: 'string', example: 'BSc in CSE' },
        subject: { type: 'string', example: 'Computer Science' },
        passing_year: { type: 'string', example: '2025' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Education updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Education updated successfully',
        data: {
          id: 'education-id-123',
          course_name: 'BSc in CSE',
          subject: 'Computer Science',
          passing_year: '2025',
        },
      },
    },
  })
  async updateEducation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateEducationDto: UpdateEducationDto,
  ) {
    const userId = req.user.userId;
    // Implement the service method to handle education update
    return await this.profileService.updateEducation(
      userId,
      id,
      updateEducationDto,
    );
  }

  //* Delete education
  @Delete('education/:id')
  @ApiOperation({
    summary: 'Delete education',
    description: 'Delete an education entry by id.',
  })
  @ApiParam({ name: 'id', description: 'Education ID', example: 'education-id-123' })
  @ApiOkResponse({
    description: 'Education deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Education deleted successfully',
      },
    },
  })
  async deleteEducation(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const userId = req.user.userId;
    return { message: 'Delete education endpoint', userId, id };
  }


  // topic:skills

  // get all skills
  @Get('skills')
  @ApiOperation({
    summary: 'Get skills',
    description: 'Retrieve all editor skills.',
  })
  @ApiOkResponse({
    description: 'Skills retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Skills retrieved successfully',
        data: [
          {
            id: 'skill-id-123',
            skill_name: 'Video Editing',
          },
        ],
      },
    },
  })
  async getSkills(
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return await this.profileService.getSkills(userId);
  }

  // *add skills
  @Post('skills')
  @ApiOperation({
    summary: 'Create skill',
    description: 'Add a new skill to the editor profile.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', example: 'Motion Graphics' },
      },
      required: ['skill_name'],
    },
  })
  @ApiOkResponse({
    description: 'Skills created successfully',
    schema: {
      example: {
        success: true,
        message: 'Skills created successfully',
        data: {
          id: 'skill-id-123',
          skill_name: 'Motion Graphics',
        },
      },
    },
  })
  async addSkills(
    @Req() req: any,
    @Body() createSkillDto: CreateSkillDto,
  ) {
    const userId = req.user.userId;
    return await this.profileService.createSkills(userId, createSkillDto);
  }

  // *update skills
  @Patch('skills/:id')
  @ApiOperation({
    summary: 'Update skill',
    description: 'Update an existing skill by id.',
  })
  @ApiParam({ name: 'id', description: 'Skill ID', example: 'skill-id-123' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        skill_name: { type: 'string', example: 'Advanced Motion Graphics' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Skill updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Skill updated successfully',
        data: {
          id: 'skill-id-123',
          skill_name: 'Advanced Motion Graphics',
        },
      },
    },
  })
  async updateSkills(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    const userId = req.user.userId;
    return await this.profileService.updateSkills(userId, id, updateSkillDto);
  } 












}
