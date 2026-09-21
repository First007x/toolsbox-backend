// ไฟล์: src/modules/tools/tools.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryToolDto } from './dto/query-tool.dto';

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryToolDto) {
    const { page = 1, limit = 10, category } = query;
    const skip = (page - 1) * limit;

    // สร้างเงื่อนไขการค้นหา (หาเฉพาะที่ isActive = true)
    const whereCondition = {
      isActive: true,
      ...(category && { category }), // ถ้ามีการส่ง category มา ให้เพิ่มในเงื่อนไข
    };

    // ดึงข้อมูลและนับจำนวนทั้งหมดไปพร้อมกัน (ทำ Transaction)
    const [tools, total] = await this.prisma.$transaction([
      this.prisma.tool.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // เรียงจากใหม่ไปเก่า
      }),
      this.prisma.tool.count({ where: whereCondition }),
    ]);

    // ส่งคืนข้อมูลพร้อม Meta Data สำหรับทำ Pagination
    return {
      data: tools,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}