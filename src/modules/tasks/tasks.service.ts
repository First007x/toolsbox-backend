// ไฟล์: src/modules/tasks/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';

@Injectable()
export class TasksService {
  // สร้าง Logger เพื่อให้เราเห็นข้อความแจ้งเตือนใน Terminal
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  // @Cron(CronExpression.EVERY_HOUR) // ของจริงควรตั้งเป็นทำทุก 1 ชั่วโมง หรือทุกเที่ยงคืน
  @Cron(CronExpression.EVERY_10_SECONDS) // 🚀 [HOTFIX สำหรับทดสอบ]: ให้ทำงานทุก 10 วินาที จะได้เห็นผลทันที
  async handleFileCleanup() {
    try {
      // 1. ค้นหาไฟล์ที่หมดอายุแล้ว (เงื่อนไข: expiresAt น้อยกว่า เวลาปัจจุบัน)
      const expiredFiles = await this.prisma.fileMetadata.findMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (expiredFiles.length === 0) {
        // เงียบไว้ถ้าไม่มีไฟล์หมดอายุ จะได้ไม่รก Terminal
        return; 
      }

      this.logger.log(`Found ${expiredFiles.length} expired file(s). Starting cleanup...`);
      let deletedCount = 0;

      // 2. วนลูปเพื่อลบไฟล์จริงออกจากฮาร์ดดิสก์ และลบข้อมูลใน DB
      for (const file of expiredFiles) {
        try {
          // ลบไฟล์จริงจาก Storage (ถ้าไฟล์หายไปแล้วจากระบบอื่น catch ไว้จะได้ไม่ Error พังทั้งลูป)
          await fs.unlink(file.storagePath).catch(() => {});
          
          // ลบข้อมูล (Record) ออกจาก Database
          await this.prisma.fileMetadata.delete({
            where: { id: file.id },
          });
          
          deletedCount++;
        } catch (err) {
          this.logger.error(`Failed to delete file ID ${file.id}`, err);
        }
      }

      this.logger.log(`Cleanup completed. Successfully deleted ${deletedCount} file(s).`);
    } catch (error) {
      this.logger.error('Error during file cleanup cronjob', error);
    }
  }
}