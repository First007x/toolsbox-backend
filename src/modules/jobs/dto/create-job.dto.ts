// ไฟล์: toolsbox-backend/src/modules/jobs/dto/create-job.dto.ts
import { IsUUID, IsString, IsIn, IsInt, Min, Max, IsArray, ArrayMinSize } from 'class-validator';
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

export class CreatePdfMergeJobDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'ต้องอัปโหลดไฟล์ PDF อย่างน้อย 2 ไฟล์เพื่อทำการรวม' })
  @IsUUID('all', { each: true, message: 'รหัสไฟล์ไม่ถูกต้อง' })
  fileIds: string[];
}

export class CreatePdfSplitJobDto {
  @IsUUID()
  fileId: string;

  @IsArray()
  pages: number[]; // รับค่าเป็น Array ของตัวเลข เช่น [1, 3, 5, 6, 7]
}