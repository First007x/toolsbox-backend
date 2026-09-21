// ไฟล์: src/modules/files/files.service.ts
import { Injectable, BadRequestException, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileSecurityUtil } from '../../common/utils/file-security.util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FilesService implements OnModuleInit {
  // โฟลเดอร์สำหรับเก็บไฟล์ชั่วคราว (รอการประมวลผล)
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'temp');

  constructor(private prisma: PrismaService) {}

  // สร้างโฟลเดอร์อัตโนมัติเมื่อระบบเริ่มทำงาน
  async onModuleInit() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async processUploadedFile(file: Express.Multer.File, userId: string, type: 'image' | 'document') {
    // 1. Security Check: ตรวจสอบ MIME Type เบื้องต้น
    if (!FileSecurityUtil.isValidMimeType(file.mimetype, type)) {
      throw new BadRequestException(`Invalid file type. Only ${type} files are allowed.`);
    }

    // 2. Security Check: สร้างชื่อไฟล์ใหม่ที่ปลอดภัย (ห้ามใช้ชื่อเดิมเด็ดขาด)
    const safeName = FileSecurityUtil.generateSafeFileName(file.originalname);
    const storagePath = path.join(this.uploadDir, safeName);

    try {
      // 3. บันทึกไฟล์ลง Disk (จาก Memory Buffer)
      await fs.writeFile(storagePath, file.buffer);

      // 4. บันทึกข้อมูล (Metadata) ลง Database เพื่อการติดตามและ Cleanup
      const fileMetadata = await this.prisma.fileMetadata.create({
        data: {
          userId,
          originalName: file.originalname,
          safeName,
          storagePath,
          mimeType: file.mimetype,
          extension: path.extname(file.originalname).toLowerCase(),
          sizeBytes: file.size,
          isProcessed: false,
          // กำหนดเวลาหมดอายุ (TTL) ให้ไฟล์ถูกลบอัตโนมัติใน 24 ชั่วโมง (กรณีไม่ถูกประมวลผล)
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
        },
      });

      // Security: คืนค่าเฉพาะข้อมูลที่ปลอดภัย (ไม่ส่ง storagePath จริงออกไปให้ Client)
      return {
        fileId: fileMetadata.id,
        originalName: fileMetadata.originalName,
        size: Number(fileMetadata.sizeBytes), // แปลง BigInt เป็น Number สำหรับแสดงผล
        expiresAt: fileMetadata.expiresAt,
      };
      
    } catch (error) {
      // ถ้าเกิด Error ระหว่างบันทึกลง DB ให้พยายามลบไฟล์ที่เพิ่งเซฟทิ้งไปเพื่อไม่ให้เป็นขยะ
      await fs.unlink(storagePath).catch(() => {});
      throw new InternalServerErrorException('Failed to process uploaded file');
    }
  }
}