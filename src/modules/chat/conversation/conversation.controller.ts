import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { USER_TYPES } from 'src/common/swagger/swagger-auth';

@ApiBearerAuth(USER_TYPES.CLIENT)
@ApiBearerAuth(USER_TYPES.EDITOR)
@ApiBearerAuth(USER_TYPES.ADMIN)
@ApiTags('Conversation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chat/conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}



  // *create conversation
  @Post()
  async create(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.conversationService.create(createConversationDto, userId);
  }

   //  *conversation list of user
  @Get('conversation-list') 
  async findAll(@Req() req) { 
    const user = req.user.userId; 
    return this.conversationService.findAll(user);
  }
 
  // get conversation by id 
  @Get('conversationById/:id')
  async findOne(@Param('id') id: string) {
    return this.conversationService.findOne(id);
  }


  // *delete conversation
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.conversationService.remove(id);
  }




}
