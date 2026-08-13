import { Injectable } from '@nestjs/common';
import { CreateDashboradDto } from './dto/create-dashborad.dto';
import { UpdateDashboradDto } from './dto/update-dashborad.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboradService {
 
  constructor(private prisma: PrismaService) {}

  create(createDashboradDto: CreateDashboradDto) {
    return 'This action adds a new dashborad';
  }

  findAll() {
    return `This action returns all dashborad`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dashborad`;
  }

  update(id: number, updateDashboradDto: UpdateDashboradDto) {
    return `This action updates a #${id} dashborad`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashborad`;
  }
}
