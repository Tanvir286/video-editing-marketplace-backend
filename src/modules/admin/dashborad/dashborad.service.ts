import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserType } from 'prisma/generated/client';

@Injectable()
export class DashboradService {
  constructor(private prisma: PrismaService) {}

  /*-----------------------------------------------------
      Total Editor, Client, Revenue Api
  ------------------------------------------------------*/
  
  async getDashboardStats() {
    return ""
  }






}

