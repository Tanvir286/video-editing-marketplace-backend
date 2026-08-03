// external imports
import { Command, CommandRunner } from 'nest-commander';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
// internal imports
import appConfig from '../config/app.config';
import { StringHelper } from '../common/helper/string.helper';
import { UserRepository } from '../common/repository/user/user.repository';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContentLength,
  JobCategory,
  Platform,
  JobStatus,
  VideoCategory,
  SoftwarePreference,
  UserType,
  BidStatus,
} from 'prisma/generated';

@Command({ name: 'seed', description: 'prisma db seed' })
export class SeedCommand extends CommandRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }
  async run(passedParam: string[]): Promise<void> {
    await this.seed(passedParam);
  }

  async seed(param: string[]) {
    try {
      fs.writeFileSync(
        'seeding.log',
        `Prisma Env: ${process.env.PRISMA_ENV}\n`,
        { flag: 'a' },
      );
      fs.writeFileSync('seeding.log', 'Seeding started...\n', { flag: 'a' });

      // begin transaction
      await this.prisma.$transaction(async ($tx) => {
        // Only run static seeds if they aren't already there
        const rolesCount = await this.prisma.role.count();
        if (rolesCount === 0) {
          fs.writeFileSync('seeding.log', 'Seeding roles...\n', { flag: 'a' });
          await this.roleSeed();
        }
        const permCount = await this.prisma.permission.count();
        if (permCount === 0) {
          fs.writeFileSync('seeding.log', 'Seeding permissions...\n', {
            flag: 'a',
          });
          await this.permissionSeed();
        }
        // check system admin user
        const systemAdminEmail = appConfig().defaultUser.system.email;
        const existAdmin = await this.prisma.user.findUnique({
          where: { email: systemAdminEmail },
        });
        if (!existAdmin) {
          fs.writeFileSync('seeding.log', 'Seeding system admin...\n', {
            flag: 'a',
          });
          await this.userSeed();
        }
        const permRoleCount = await this.prisma.permissionRole.count();
        if (permRoleCount === 0) {
          fs.writeFileSync('seeding.log', 'Seeding permission roles...\n', {
            flag: 'a',
          });
          await this.permissionRoleSeed();
        }

        // Clean and Seed Clients, Editors, Jobs, and Hires
        fs.writeFileSync('seeding.log', 'Cleaning old seed data...\n', {
          flag: 'a',
        });
        await this.cleanSeedData();
        fs.writeFileSync('seeding.log', 'Seeding clients and editors...\n', {
          flag: 'a',
        });
        const { clients, editors } = await this.clientEditorSeed();

        fs.writeFileSync('seeding.log', 'Seeding jobs...\n', { flag: 'a' });
        const jobs = await this.jobSeed(clients, editors);
        fs.writeFileSync('seeding.log', 'Seeding hires...\n', { flag: 'a' });
        await this.hireSeed(clients, editors);
        fs.writeFileSync('seeding.log', 'Seeding reviews and deliveries...\n', {
          flag: 'a',
        });
        await this.reviewAndDeliverySeed(jobs, clients, editors);
      });

      fs.writeFileSync('seeding.log', 'Seeding done successfully.\n', {
        flag: 'a',
      });
    } catch (error) {
      fs.writeFileSync(
        'seeding.log',
        `Seeding error: ${error.stack || error}\n`,
        { flag: 'a' },
      );
      throw error;
    }
  }

  async cleanSeedData() {
    console.log('Cleaning up old seeded data...');
    const seededEmails = [
      ...Array.from({ length: 10 }, (_, i) => `client${i + 1}@waffles.com`),
      ...Array.from({ length: 10 }, (_, i) => `editor${i + 1}@waffles.com`),
    ];

    const seededUsers = await this.prisma.user.findMany({
      where: {
        email: {
          in: seededEmails,
        },
      },
      select: { id: true },
    });
    const seededUserIds = seededUsers.map((u) => u.id);

    if (seededUserIds.length > 0) {
      // Delete attachments linked to hires, reviews, and deliveries of our users
      await this.prisma.attachment.deleteMany({
        where: {
          OR: [
            { hire: { user_id: { in: seededUserIds } } },
            { hire: { hire_profile_id: { in: seededUserIds } } },
            { review: { user_id: { in: seededUserIds } } },
            { review: { service_provider_id: { in: seededUserIds } } },
            { delivery: { user_id: { in: seededUserIds } } },
          ],
        },
      });

      await this.prisma.notification.deleteMany({
        where: {
          OR: [
            { sender_id: { in: seededUserIds } },
            { receiver_id: { in: seededUserIds } },
          ],
        },
      });

      await this.prisma.userPaymentMethod.deleteMany({
        where: { user_id: { in: seededUserIds } },
      });

      await this.prisma.paymentTransaction.deleteMany({
        where: { user_id: { in: seededUserIds } },
      });

      await this.prisma.userSetting.deleteMany({
        where: { user_id: { in: seededUserIds } },
      });

      await this.prisma.ucode.deleteMany({
        where: { user_id: { in: seededUserIds } },
      });

      await this.prisma.review.deleteMany({
        where: {
          OR: [
            { user_id: { in: seededUserIds } },
            { service_provider_id: { in: seededUserIds } },
          ],
        },
      });

      await this.prisma.jobDelivery.deleteMany({
        where: {
          user_id: { in: seededUserIds },
        },
      });

      await this.prisma.extensionRequest.deleteMany({
        where: {
          user_id: { in: seededUserIds },
        },
      });

      await this.prisma.bid.deleteMany({
        where: {
          user_id: { in: seededUserIds },
        },
      });

      await this.prisma.hire.deleteMany({
        where: {
          OR: [
            { user_id: { in: seededUserIds } },
            { hire_profile_id: { in: seededUserIds } },
          ],
        },
      });

      await this.prisma.jOB.deleteMany({
        where: {
          user_id: { in: seededUserIds },
        },
      });

      await this.prisma.roleUser.deleteMany({
        where: {
          user_id: { in: seededUserIds },
        },
      });

      await this.prisma.user.deleteMany({
        where: {
          id: { in: seededUserIds },
        },
      });
    }
  }

  async clientEditorSeed() {
    const passwordHash = await bcrypt.hash(
      'password123',
      appConfig().security.salt,
    );
    const clients = [];
    const editors = [];
    const editorSkillsMap: Record<number, string[]> = {
      1: ['html', 'css', 'js'],
      2: ['css', 'js'],
      3: ['js'],
      4: ['html', 'js'],
    };

    // Create 10 Client users
    for (let i = 1; i <= 10; i++) {
      const client = await this.prisma.user.create({
        data: {
          username: `client${i}`,
          email: `client${i}@waffles.com`,
          password: passwordHash,
          type: UserType.CLIENT,
          first_name: 'Client',
          last_name: String(i),
          name: `Client ${i}`,
          status: 1,
          approved_at: new Date(),
          email_verified_at: new Date(),
        },
      });
      clients.push(client);
    }

    // Create 10 Editor users
    for (let i = 1; i <= 10; i++) {
      const editor = await this.prisma.user.create({
        data: {
          username: `editor${i}`,
          email: `editor${i}@waffles.com`,
          password: passwordHash,
          type: UserType.EDITOR,
          first_name: 'Editor',
          last_name: String(i),
          name: `Editor ${i}`,
          status: 1,
          approved_at: new Date(),
          email_verified_at: new Date(),
        },
      });
      editors.push(editor);

      const skillsForEditor = editorSkillsMap[i];
      if (skillsForEditor?.length) {
        await this.prisma.skills.createMany({
          data: skillsForEditor.map((skillName) => ({
            skill_name: skillName,
            user_id: editor.id,
          })),
        });
      }
    }

    return { clients, editors };
  }

  async jobSeed(clients: any[], editors: any[]) {
    console.log('Seeding 10 jobs...');
    const contentLengths = Object.values(ContentLength);
    const jobCategories = Object.values(JobCategory);
    const platforms = Object.values(Platform);
    const jobs = [];

    for (let i = 1; i <= 10; i++) {
      const client = i <= 6 ? clients[0] : clients[(i - 1) % clients.length];
      const contentLength = contentLengths[(i - 1) % contentLengths.length];
      const jobCategory = jobCategories[(i - 1) % jobCategories.length];
      const platform = platforms[(i - 1) % platforms.length];
      const skillOptions = ['HTML', 'CSS', 'JS', 'React', 'Next', 'Node', 'Nest'];
      const selectedSkills = [
        skillOptions[(i - 1) % skillOptions.length],
        skillOptions[(i + 2) % skillOptions.length],
      ];
      const skillText = selectedSkills.join(', ');

      // Jobs 1-4: PENDING (bids PENDING)
      // Jobs 5-7: IN_PROGRESS (one bid IN_PROGRESS, others PENDING)
      // Jobs 8-10: COMPLETED (one bid ACCEPTED, others PENDING)
      let status: JobStatus = JobStatus.PENDING;
      if (i >= 5 && i <= 7) {
        status = JobStatus.IN_PROGRESS;
      } else if (i >= 8) {
        status = JobStatus.COMPLETED;
      }

      const job = await this.prisma.jOB.create({
        data: {
          job_title: `Professional Video Editor Needed for ${platform} - Project ${i}`,
          job_description: `We are looking for an experienced video editor to work on a ${jobCategory.toLowerCase().replace(/_/g, ' ')} project. The content length will be around ${contentLength}. Need professional coloring and sound design.`,
          job_content_length: contentLength,
          job_budget: parseFloat((100 + i * 50).toFixed(2)),
          job_category: jobCategory,
          job_duration: parseFloat((3 + i).toFixed(1)),
          job_platform: platform,
          job_skill: skillText,
          job_status: status,
          user_id: client.id,
        },
      });
      jobs.push(job);

      // Create 4 bids for each job using different editors
      for (let j = 0; j < 4; j++) {
        const editor = i <= 6 && j === 0 ? editors[0] : editors[(i - 1 + j) % editors.length];
        const bidAmount = parseFloat(
          (job.job_budget * (0.8 + j * 0.1)).toFixed(2),
        );
        const bidDuration = parseFloat(
          (job.job_duration * (0.8 + j * 0.1)).toFixed(1),
        );

        let bidStatus: BidStatus = BidStatus.PENDING;
        if (status === JobStatus.IN_PROGRESS && j === 0) {
          bidStatus = BidStatus.IN_PROGRESS;
        } else if (status === JobStatus.COMPLETED && j === 0) {
          bidStatus = BidStatus.ACCEPTED;
        }

        await this.prisma.bid.create({
          data: {
            amount: bidAmount,
            req_date: bidDuration,
            message: `Hi Client, I am ${editor.name}. I would love to edit your ${jobCategory.toLowerCase().replace(/_/g, ' ')} project on ${platform}. I have a lot of experience and can deliver within ${bidDuration} days.`,
            jobId: job.id,
            user_id: editor.id,
            status: bidStatus,
          },
        });
      }
    }
    return jobs;
  }

  async reviewAndDeliverySeed(jobs: any[], clients: any[], editors: any[]) {
    const deliveries = await this.deliverySeed(jobs, editors);
    await this.reviewSeed(jobs, editors, deliveries);
    return { deliveries };
  }

  async deliverySeed(jobs: any[], editors: any[]) {
    console.log('Seeding deliveries...');
    const deliveries = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const assignedEditor = i < 3 ? editors[0] : editors[i % editors.length];

      // Create accepted deliveries only for COMPLETED jobs
      if (job.job_status === JobStatus.COMPLETED) {
        const delivery = await this.prisma.jobDelivery.create({
          data: {
            job_id: job.id,
            user_id: assignedEditor.id,
            message: `Hi Client, I have finished editing the video for project ${i + 1}. I've applied the requested color grading and audio fixes. Please review the attached file!`,
            status: 'ACCEPTED',
          },
        });
        deliveries.push(delivery);
      }
    }
    return deliveries;
  }

  async hireSeed(clients: any[], editors: any[]) {
    console.log('Seeding 10 hires...');
    const videoCategories = Object.values(VideoCategory);
    const contentLengths = Object.values(ContentLength);
    const softwarePreferences = Object.values(SoftwarePreference);

    for (let i = 1; i <= 10; i++) {
      const client = i <= 6 ? clients[0] : clients[(i - 1) % clients.length];
      const editor = i <= 6 ? editors[0] : editors[(i - 1) % editors.length];
      const videoCategory = videoCategories[(i - 1) % videoCategories.length];
      const contentLength = contentLengths[(i - 1) % contentLengths.length];
      const softwarePref = [
        softwarePreferences[(i - 1) % softwarePreferences.length],
        softwarePreferences[i % softwarePreferences.length],
      ];

      await this.prisma.hire.create({
        data: {
          project_title: `Video Editing for Client ${client.username} by Editor ${editor.username}`,
          video_category: videoCategory,
          video_duration: contentLength,
          description: `This is a direct hire project. The editor ${editor.name} will edit a ${videoCategory.toLowerCase().replace(/_/g, ' ')} video of length ${contentLength}.`,
          project_budget: parseFloat((200 + i * 75).toFixed(2)),
          project_duration: parseFloat((5 + i).toFixed(1)),
          total_amount: parseFloat((200 + i * 75).toFixed(2)),
          hire_profile_id: editor.id,
          user_id: client.id,
          status: JobStatus.PENDING,
          software_preference: softwarePref,
        },
      });
    }
  }

  async reviewSeed(jobs: any[], editors: any[], deliveries: any[]) {
    console.log('Seeding reviews...');

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const assignedEditor = i < 3 ? editors[0] : editors[i % editors.length];
      const clientId = job.user_id;

      // Find matching delivery for this job
      const matchingDelivery = deliveries.find((d) => d.job_id === job.id);

      // Reviews should ideally exist for COMPLETED jobs
      if (clientId && assignedEditor && job.job_status === JobStatus.COMPLETED) {
        await this.prisma.review.create({
          data: {
            rating: i % 4 === 0 ? 4 : 5,
            comment: `Excellent work on project ${i + 1}! Highly professional video editing, crisp pacing, and incredible sound balancing. Will definitely hire again.`,
            communication_quality: 5,
            on_time_delivery: 5,
            value_for_money: 5,
            would_recommend: 5,
            user_id: clientId,
            job_id: job.id,
            delivery_id: matchingDelivery ? matchingDelivery.id : undefined,
            service_provider_id: assignedEditor.id,
          },
        });
      }
    }
  }

  //---- user section ----
  async userSeed() {
    const systemUser = await this.userRepository.createSuAdminUser({
      username: appConfig().defaultUser.system.username,
      email: appConfig().defaultUser.system.email,
      password: appConfig().defaultUser.system.password,
    });

    await this.prisma.roleUser.create({
      data: {
        user_id: systemUser.id,
        role_id: '1',
      },
    });
  }

  async permissionSeed() {
    let i = 0;
    const permissions = [];
    const permissionGroups = [
      { title: 'system_tenant_management', subject: 'SystemTenant' },
      { title: 'user_management', subject: 'User' },
      { title: 'role_management', subject: 'Role' },
      { title: 'Project', subject: 'Project' },
      {
        title: 'Task',
        subject: 'Task',
        scope: ['read', 'create', 'update', 'show', 'delete', 'assign'],
      },
      { title: 'Comment', subject: 'Comment' },
    ];

    for (const permissionGroup of permissionGroups) {
      if (permissionGroup['scope']) {
        for (const permission of permissionGroup['scope']) {
          permissions.push({
            id: String(++i),
            title: permissionGroup.title + '_' + permission,
            action: StringHelper.cfirst(permission),
            subject: permissionGroup.subject,
          });
        }
      } else {
        for (const permission of [
          'read',
          'create',
          'update',
          'show',
          'delete',
        ]) {
          permissions.push({
            id: String(++i),
            title: permissionGroup.title + '_' + permission,
            action: StringHelper.cfirst(permission),
            subject: permissionGroup.subject,
          });
        }
      }
    }

    await this.prisma.permission.createMany({
      data: permissions,
    });
  }

  async permissionRoleSeed() {
    const all_permissions = await this.prisma.permission.findMany();
    const su_admin_permissions = all_permissions.filter(function (permission) {
      return permission.title.substring(0, 25) == 'system_tenant_management_';
    });

    const adminPermissionRoleArray = [];
    for (const su_admin_permission of su_admin_permissions) {
      adminPermissionRoleArray.push({
        role_id: '1',
        permission_id: su_admin_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: adminPermissionRoleArray,
    });

    const project_admin_permissions = all_permissions.filter(
      function (permission) {
        return permission.title.substring(0, 25) != 'system_tenant_management_';
      },
    );

    const projectAdminPermissionRoleArray = [];
    for (const admin_permission of project_admin_permissions) {
      projectAdminPermissionRoleArray.push({
        role_id: '2',
        permission_id: admin_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: projectAdminPermissionRoleArray,
    });

    const project_manager_permissions = all_permissions.filter(
      function (permission) {
        return (
          permission.title == 'project_read' ||
          permission.title == 'project_show' ||
          permission.title == 'project_update' ||
          permission.title.substring(0, 4) == 'Task' ||
          permission.title.substring(0, 7) == 'Comment'
        );
      },
    );

    const projectManagerPermissionRoleArray = [];
    for (const project_manager_permission of project_manager_permissions) {
      projectManagerPermissionRoleArray.push({
        role_id: '3',
        permission_id: project_manager_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: projectManagerPermissionRoleArray,
    });

    const member_permissions = all_permissions.filter(function (permission) {
      return (
        permission.title == 'project_read' ||
        permission.title == 'project_show' ||
        permission.title == 'task_read' ||
        permission.title == 'task_show' ||
        permission.title == 'task_update' ||
        permission.title.substring(0, 7) == 'comment'
      );
    });

    const memberPermissionRoleArray = [];
    for (const project_manager_permission of member_permissions) {
      memberPermissionRoleArray.push({
        role_id: '4',
        permission_id: project_manager_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: memberPermissionRoleArray,
    });

    const viewer_permissions = all_permissions.filter(function (permission) {
      return (
        permission.title == 'project_read' ||
        permission.title == 'project_show' ||
        permission.title == 'task_read' ||
        permission.title == 'comment_read'
      );
    });

    const viewerPermissionRoleArray = [];
    for (const viewer_permission of viewer_permissions) {
      viewerPermissionRoleArray.push({
        role_id: '5',
        permission_id: viewer_permission.id,
      });
    }
    await this.prisma.permissionRole.createMany({
      data: viewerPermissionRoleArray,
    });
  }

  async roleSeed() {
    await this.prisma.role.createMany({
      data: [
        {
          id: '1',
          title: 'Super Admin',
          name: 'su_admin',
        },
        {
          id: '2',
          title: 'Admin',
          name: 'admin',
        },
        {
          id: '3',
          title: 'Project Manager',
          name: 'project_manager',
        },
        {
          id: '4',
          title: 'Member',
          name: 'member',
        },
        {
          id: '5',
          title: 'Viewer',
          name: 'viewer',
        },
      ],
    });
  }
}
