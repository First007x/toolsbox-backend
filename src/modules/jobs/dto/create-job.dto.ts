// ไฟล์: toolsbox-backend/src/modules/jobs/dto/create-job.dto.ts
import { IsUUID, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateImageConvertJobDto {
  @IsUUID()
  fileId: string;

  @IsString()
  @IsIn(['jpeg', 'png', 'webp'])
  targetFormat: 'jpeg' | 'png' | 'webp';
}

// 🚀 เพิ่ม DTO ใหม่สำหรับรับค่าลดขนาดรูปภาพ
export class CreateImageCompressJobDto {
  @IsUUID()
  fileId: string;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(100)
  quality: number; // รับค่าความชัด 10 ถึง 100
}

// 🚀 เพิ่ม DTO ใหม่: สำหรับรับข้อมูลโค้ดที่ต้องการจัดระเบียบ
export class FormatCodeJobDto {
  @IsString()
  code: string;

  @IsString()
  @IsIn(['json', 'html', 'javascript'])
  language: 'json' | 'html' | 'javascript';
  }
  

  // 🚀 เพิ่ม DTO ใหม่: สำหรับลบพื้นหลังรูปภาพ
export class CreateRemoveBgJobDto {
  @IsUUID()
  fileId: string;
}
