// ไฟล์: src/modules/files/files.controller.ts
import { 
    Controller, Post, UseInterceptors, UploadedFile, 
    UseGuards, Req, BadRequestException, Body 
  } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';
  
@Controller('files')
@UseGuards(GatewayAuthGuard) // Security: บังคับใช้ Gateway Auth
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    // Security: จำกัดขนาดไฟล์สูงสุด (เช่น 15MB) ป้องกัน DoS
    limits: { fileSize: 15 * 1024 * 1024 },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body('type') type: 'image' | 'document' = 'image' // รับ Parameter ระบุประเภทไฟล์
  ) {
    // ตรวจสอบว่ามีการแนบไฟล์มาจริงหรือไม่
    if (!file) {
      throw new BadRequestException('No file provided or file size exceeds the limit.');
    }

    // ตรวจสอบประเภทที่ส่งมาให้ถูกต้อง
    if (type !== 'image' && type !== 'document') {
      throw new BadRequestException('Invalid type parameter. Use "image" or "document".');
    }

    // ดึง User ID จาก Guard และส่งให้ Service จัดการต่อ
    const userId = req.user.id;
    return this.filesService.processUploadedFile(file, userId, type);
  }
}