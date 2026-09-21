// ไฟล์: src/modules/tools/tools.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { QueryToolDto } from './dto/query-tool.dto';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';

// URL จะกลายเป็น /api/v1/tools อัตโนมัติ (เพราะ prefix ถูกตั้งใน main.ts แล้ว)
@Controller('tools')
@UseGuards(GatewayAuthGuard) // Security: บังคับว่าต้องมี X-User-Id จาก Gateway เท่านั้น
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  async getTools(@Query() query: QueryToolDto) {
    // Interceptor ของเราจะช่วยแปลงข้อมูลให้เป็น { success: true, data: ..., meta: ... } และทำ snake_case ให้อัตโนมัติ
    return this.toolsService.findAll(query);
  }
}