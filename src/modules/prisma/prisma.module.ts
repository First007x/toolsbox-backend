// ไฟล์: src/modules/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ตั้งเป็น Global เพื่อให้ Module อื่นๆ เรียกใช้ Database ได้โดยไม่ต้อง Import ซ้ำ
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export Service ออกไปให้ชาวบ้านใช้
})
export class PrismaModule {}