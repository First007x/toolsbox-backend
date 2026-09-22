// ไฟล์: toolsbox-backend/src/modules/jobs/jobs.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateImageConvertJobDto, CreateImageCompressJobDto,CreatePdfSplitJobDto, FormatCodeJobDto, CreateRemoveBgJobDto, CreatePdfMergeJobDto } from './dto/create-job.dto';
import { GatewayAuthGuard } from '../../common/guards/gateway-auth.guard';

@Controller('jobs')
@UseGuards(GatewayAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('image-convert')
  async convertImage(
    @Body() dto: CreateImageConvertJobDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.jobsService.processImage(dto, userId);
  }

  // 🚀 เพิ่ม Endpoint ใหม่สำหรับลดขนาดรูปภาพ
  @Post('image-compress')
  async compressImage(
    @Body() dto: CreateImageCompressJobDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.jobsService.compressImage(dto, userId);
  }

  // 🚀 เพิ่ม Endpoint ใหม่: สำหรับจัดระเบียบโค้ด
  @Post('code-format')
  async formatCode(
    @Body() dto: FormatCodeJobDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.jobsService.formatCode(dto, userId);
  }
  // 🚀 เพิ่ม Endpoint ใหม่: สำหรับลบพื้นหลังรูปภาพ
  @Post('image-remove-bg')
  async removeBackground(
    @Body() dto: CreateRemoveBgJobDto,
    @Req() req: any
  ) {
    const userId = req.user.id;
    return this.jobsService.removeBackground(dto, userId);
  }

 @Post('pdf-merge')
async mergePdf(
  @Body() dto: CreatePdfMergeJobDto,
  @Req() req: any,
) {
  const userId = req.user.id;

  return this.jobsService.mergePdf(dto, userId);
}

@Post('pdf-split')
  async splitPdf(@Body() dto: CreatePdfSplitJobDto, @Req() req: any) {
    const userId = req.user.id;
    return this.jobsService.splitPdf(dto, userId);
  }
}