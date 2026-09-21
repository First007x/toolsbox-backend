// ไฟล์: src/modules/tools/dto/query-tool.dto.ts
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// Security: ใช้ DTO กรองและแปลงประเภทข้อมูลจาก Query String ป้องกัน Injection
export class QueryToolDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1; // หน้าเริ่มต้นคือ 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10; // ดึงข้อมูลครั้งละ 10 รายการ

  @IsOptional()
  @IsString()
  category?: string; // ใช้กรองตามหมวดหมู่ (MULTIMEDIA, DOCUMENT, etc.)
}