// ไฟล์: src/modules/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // เชื่อมต่อ Database อัตโนมัติเมื่อ Module เริ่มทำงาน
  async onModuleInit() {
    await this.$connect();
  }

  // ตัดการเชื่อมต่อเมื่อปิดระบบ (ป้องกัน Connection Leak)
  async onModuleDestroy() {
    await this.$disconnect();
  }
}