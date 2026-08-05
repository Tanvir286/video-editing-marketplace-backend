import { Injectable } from '@nestjs/common';
import { CreateExtensionDto } from './dto/create-extension.dto';
import { UpdateExtensionDto } from './dto/update-extension.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExtensionService {

  constructor(private prisma: PrismaService) {}

  

 
}
