import { ConflictException, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  // *create conversation
  async create(createConversationDto: CreateConversationDto, sender: string) {
    const { participant_id } = createConversationDto;

    if (participant_id === sender) {
      throw new ConflictException('Cannot create conversation with yourself');
    }

    // check if conversation already exists between the two users
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participant: { some: { user_id: sender } } },
          { participant: { some: { user_id: participant_id } } },
        ],
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return {
        message: 'Conversation already exists',
        success: true,
        conversation: {
          id: existingConversation.id,
          participants: existingConversation.participant.map((p) => ({
            userId: p.user.id,
            name: p.user.name,
            avatar: p.user.avatar,
            avatar_url: p.user.avatar
              ? SojebStorage.url(
                  `${appConfig().storageUrl.avatar}/${p.user.avatar}`,
                )
              : null,
          })),
        },
      };
    }

    // create new conversation
    const newConversation = await this.prisma.conversation.create({
      data: {
        participant: {
          create: [{ user_id: sender }, { user_id: participant_id }],
        },
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const formattedParticipants = {
      id: newConversation.id,
      participants: newConversation.participant.map((p) => ({
        userId: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
        avatar_url: p.user.avatar
          ? SojebStorage.url(
              `${appConfig().storageUrl.avatar}/${p.user.avatar}`,
            )
          : null,
      })),
    };
    return {
      message: 'Conversation created successfully',
      success: true,
      conversation: formattedParticipants,
    };
  }

  //  *conversation list of user
  async findAll(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participant: { some: { user_id: userId } },
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const formattedConversations = conversations.map((conversation) => ({
      id: conversation.id,
      participants: conversation.participant.map((p) => ({
        userId: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
        avatar_url: p.user.avatar
          ? SojebStorage.url(
              `${appConfig().storageUrl.avatar}/${p.user.avatar}`,
            )
          : null,
      })),
    }));
    return {
      message: 'Conversations retrieved successfully',
      success: true,
      conversations: formattedConversations,
    };
  }

  // get conversation by id
  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        participant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) throw new ConflictException('Conversation not found');

    const formattedConversation = {
      id: conversation.id,
      participants: conversation.participant.map((p) => ({
        userId: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
        avatar_url: p.user.avatar
          ? SojebStorage.url(
              `${appConfig().storageUrl.avatar}/${p.user.avatar}`,
            )
          : null,
      })),
    };

    return {
      success: true,
      message: 'Conversation retrieved successfully',
      conversation: formattedConversation,
    };
  }
 
  // *delete conversation
  async remove(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!conversation) throw new ConflictException('Conversation not found');

    await this.prisma.conversation.delete({
      where: { id },
    });
    return {
      success: true,
      message: 'Conversation deleted successfully',
    };
  }




}
