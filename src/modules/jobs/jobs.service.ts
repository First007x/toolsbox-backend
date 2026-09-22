// ไฟล์: toolsbox-backend/src/modules/jobs/jobs.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  OnModuleInit,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import sharp from "sharp";

import * as fs from "fs/promises";
import * as path from "path";
import { PDFDocument } from 'pdf-lib';

import {
  CreateImageConvertJobDto,
  CreateImageCompressJobDto,
  FormatCodeJobDto,
  CreateRemoveBgJobDto,
  CreatePdfMergeJobDto,
  CreatePdfSplitJobDto,
} from "./dto/create-job.dto";

import * as beautify from "js-beautify";

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly processedDir = path.join(
    process.cwd(),
    "uploads",
    "processed"
  );

  constructor(private prisma: PrismaService) { }

  // ========================================
  // สร้างโฟลเดอร์สำหรับไฟล์ Processed
  // ========================================
  async onModuleInit() {
    try {
      await fs.mkdir(this.processedDir, {
        recursive: true,
      });
    } catch (error) {
      console.error(
        "Failed to create processed directory:",
        error
      );
    }
  }

  // ========================================
  // 1. Image Converter
  // ========================================
  async processImage(
    dto: CreateImageConvertJobDto,
    userId: string
  ) {
    const { fileId, targetFormat } = dto;

    const fileRecord =
      await this.prisma.fileMetadata.findFirst({
        where: {
          id: fileId,
          userId: userId,
        },
      });

    if (!fileRecord) {
      throw new NotFoundException(
        "File not found or access denied"
      );
    }

    if (fileRecord.isProcessed) {
      throw new BadRequestException(
        "This file has already been processed"
      );
    }

    const job = await this.prisma.processingJob.create({
      data: {
        toolCode: "IMG_CONVERTER",
        userId: userId,
        status: "PROCESSING",
      },
    });

    try {
      const newFileName = `converted-${Date.now()}.${targetFormat}`;

      const outputPath = path.join(
        this.processedDir,
        newFileName
      );

      await sharp(fileRecord.storagePath)
        .toFormat(targetFormat as any)
        .toFile(outputPath);

      const updatedJob =
        await this.prisma.processingJob.update({
          where: {
            id: job.id,
          },
          data: {
            status: "COMPLETED",
            resultUrl: `/uploads/processed/${newFileName}`,
          },
        });

      await this.prisma.fileMetadata.update({
        where: {
          id: fileId,
        },
        data: {
          isProcessed: true,
          jobId: job.id,
        },
      });

      return {
        jobId: updatedJob.id,
        status: updatedJob.status,
        resultUrl: updatedJob.resultUrl,
      };
    } catch (error: any) {
      await this.prisma.processingJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      });

      throw new InternalServerErrorException(
        `Image processing failed: ${error.message}`
      );
    }
  }

  // ========================================
  // 2. Image Compressor
  // ========================================
  async compressImage(
    dto: CreateImageCompressJobDto,
    userId: string
  ) {
    const { fileId, quality } = dto;

    const fileRecord =
      await this.prisma.fileMetadata.findFirst({
        where: {
          id: fileId,
          userId: userId,
        },
      });

    if (!fileRecord) {
      throw new NotFoundException(
        "File not found or access denied"
      );
    }

    if (fileRecord.isProcessed) {
      throw new BadRequestException(
        "This file has already been processed"
      );
    }

    const job = await this.prisma.processingJob.create({
      data: {
        toolCode: "IMG_COMPRESSOR",
        userId: userId,
        status: "PROCESSING",
      },
    });

    try {
      // ดึงนามสกุลไฟล์เดิม
      let ext = fileRecord.extension
        .replace(".", "")
        .toLowerCase();

      // Sharp ใช้ jpeg แทน jpg
      if (ext === "jpg") {
        ext = "jpeg";
      }

      const newFileName = `compressed-${Date.now()}.${ext}`;

      const outputPath = path.join(
        this.processedDir,
        newFileName
      );

      let sharpInstance = sharp(
        fileRecord.storagePath
      );

      // JPEG
      if (ext === "jpeg") {
        sharpInstance = sharpInstance.jpeg({
          quality: quality,
        });
      }

      // PNG
      else if (ext === "png") {
        sharpInstance = sharpInstance.png({
          quality: quality,
          compressionLevel: 8,
        });
      }

      // WEBP
      else if (ext === "webp") {
        sharpInstance = sharpInstance.webp({
          quality: quality,
        });
      }

      await sharpInstance.toFile(outputPath);

      const updatedJob =
        await this.prisma.processingJob.update({
          where: {
            id: job.id,
          },
          data: {
            status: "COMPLETED",
            resultUrl: `/uploads/processed/${newFileName}`,
          },
        });

      await this.prisma.fileMetadata.update({
        where: {
          id: fileId,
        },
        data: {
          isProcessed: true,
          jobId: job.id,
        },
      });

      return {
        jobId: updatedJob.id,
        status: updatedJob.status,
        resultUrl: updatedJob.resultUrl,
      };
    } catch (error: any) {
      await this.prisma.processingJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      });

      throw new InternalServerErrorException(
        `Image compression failed: ${error.message}`
      );
    }
  }

  // ========================================
  // 3. Code Formatter
  // ========================================
  async formatCode(
    dto: FormatCodeJobDto,
    userId: string
  ) {
    const { code, language } = dto;

    const job = await this.prisma.processingJob.create({
      data: {
        toolCode: "CODE_FORMATTER",
        userId: userId,
        status: "PROCESSING",
      },
    });

    try {
      let formattedCode = "";
      let autoFixed = false;
      let autoFixMessage = "";

      // ========================================
      // JSON
      // ========================================
      if (language === "json") {
        try {
          // กรณี JSON ถูกต้อง
          formattedCode = JSON.stringify(
            JSON.parse(code),
            null,
            2
          );
        } catch (jsonError: any) {
          let repairedCode = code;
          const fixMessages: string[] = [];

          // ----------------------------------------
          // 1. ซ่อม Unquoted Key
          // เช่น { name: "John" }
          // -> { "name": "John" }
          // ----------------------------------------
          const unquotedKeyRegex =
            /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;

          if (unquotedKeyRegex.test(repairedCode)) {
            repairedCode = repairedCode.replace(
              unquotedKeyRegex,
              '$1"$2":'
            );

            fixMessages.push(
              'เครื่องหมาย "" (Key)'
            );
          }

          // ----------------------------------------
          // 2. ซ่อม Missing Colon
          // เช่น { "name" "John" }
          // -> { "name": "John" }
          // ----------------------------------------
          const missingColonRegex =
            /([{,]\s*"[^"]+")(\s+)("[^"]+"|true|false|null|-?\d+(?:\.\d+)?)/g;

          if (missingColonRegex.test(repairedCode)) {
            repairedCode = repairedCode.replace(
              missingColonRegex,
              "$1: $3"
            );

            fixMessages.push(
              "เครื่องหมาย :"
            );
          }

          // ----------------------------------------
          // 3. ซ่อม Unquoted Value
          // เช่น { "name": John }
          // -> { "name": "John" }
          // ----------------------------------------
          const unquotedValueRegex =
            /:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[,}])/g;

          let addedValueQuotes = false;

          repairedCode = repairedCode.replace(
            unquotedValueRegex,
            (match, word) => {
              if (
                ["true", "false", "null"].includes(
                  word
                ) ||
                !isNaN(Number(word))
              ) {
                return match;
              }

              addedValueQuotes = true;

              return `: "${word}"`;
            }
          );

          if (addedValueQuotes) {
            fixMessages.push(
              'เครื่องหมาย "" (Value)'
            );
          }

          // ----------------------------------------
          // 4. ซ่อม Missing Comma
          // เช่น
          // {
          //   "name": "John"
          //   "age": 20
          // }
          //
          // ->
          //
          // {
          //   "name": "John",
          //   "age": 20
          // }
          // ----------------------------------------
          const missingCommaRegex =
            /(["}\]])\s*\n(\s*")/g;

          if (missingCommaRegex.test(repairedCode)) {
            repairedCode = repairedCode.replace(
              missingCommaRegex,
              "$1,\n$2"
            );

            fixMessages.push(
              "เครื่องหมาย ,"
            );
          }

          // ----------------------------------------
          // ตรวจว่ามีการแก้ไขจริงหรือไม่
          // ----------------------------------------
          if (repairedCode !== code) {
            try {
              // ตรวจ JSON อีกครั้งหลังซ่อม
              const parsedRepairedCode =
                JSON.parse(repairedCode);

              formattedCode = JSON.stringify(
                parsedRepairedCode,
                null,
                2
              );

              autoFixed = true;

              autoFixMessage =
                fixMessages.length > 0
                  ? `พบจุดผิดพลาด! ระบบช่วยเติม ${fixMessages.join(
                    ", "
                  )} ให้เรียบร้อยแล้ว`
                  : "ระบบตรวจพบข้อผิดพลาดและสามารถซ่อมแซม JSON ได้";
            } catch {
              // ซ่อมแล้วแต่ JSON ยังไม่ถูกต้อง
              throw new Error(
                `รูปแบบ JSON ผิดพลาด: ${jsonError.message}`
              );
            }
          } else {
            throw new Error(
              `รูปแบบ JSON ผิดพลาด: ${jsonError.message}`
            );
          }
        }
      }

      // ========================================
      // HTML
      // ========================================
      else if (language === "html") {
        formattedCode = beautify.html(code, {
          indent_size: 2,
          preserve_newlines: true,
        });
      }

      // ========================================
      // JavaScript
      // ========================================
      else if (language === "javascript") {
        formattedCode = beautify.js(code, {
          indent_size: 2,
          space_in_empty_paren: true,
        });
      }

      // ========================================
      // ภาษาไม่รองรับ
      // ========================================
      else {
        throw new BadRequestException(
          "ไม่รองรับภาษาที่ระบุ"
        );
      }

      // ========================================
      // อัปเดต Job สำเร็จ
      // ========================================
      await this.prisma.processingJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "COMPLETED",
        },
      });

      // ========================================
      // Response
      // ========================================
      return {
        jobId: job.id,
        status: "COMPLETED",
        formattedCode,
        autoFixed,
        autoFixMessage,
      };
    } catch (error: any) {
      // ========================================
      // อัปเดต Job ล้มเหลว
      // ========================================
      await this.prisma.processingJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      });

      // ถ้าเป็น BadRequestException อยู่แล้ว
      // ไม่ต้องห่อซ้ำ
      if (error instanceof BadRequestException) {
        throw error;
      }

      // ดึงข้อความ Error จริง
      const exactError =
        error instanceof Error
          ? error.message
          : "Syntax Error";

      throw new BadRequestException(
        `ไม่สามารถจัดระเบียบได้ -> ${exactError}`
      );
    }
  }

  // ========================================
  // 4. 🚀 ระบบลบพื้นหลังรูปภาพ
  // Remove BG - Mockup
  // ========================================
  // ... existing code ...
  // --- 4. 🚀 ระบบลบพื้นหลังรูปภาพ (Remove BG - ของจริง) ---
  async removeBackground(dto: CreateRemoveBgJobDto, userId: string) {
    const { fileId } = dto;

    const fileRecord = await this.prisma.fileMetadata.findFirst({
      where: { id: fileId, userId: userId }
    });

    if (!fileRecord) throw new NotFoundException('File not found or access denied');
    if (fileRecord.isProcessed) throw new BadRequestException('This file has already been processed');

    const job = await this.prisma.processingJob.create({
      data: { toolCode: 'IMG_REMOVE_BG', userId: userId, status: 'PROCESSING' }
    });

    try {
      const apiKey = process.env.REMOVE_BG_API_KEY;
      if (!apiKey || apiKey === 'เอา_API_KEY_ที่ก๊อปปี้มา_วางทับข้อความนี้เลยครับ') {
        throw new Error('กรุณาตั้งค่า REMOVE_BG_API_KEY ในไฟล์ .env');
      }

      const newFileName = `removed-bg-${Date.now()}.png`;
      const outputPath = path.join(this.processedDir, newFileName);

      // 1. อ่านไฟล์รูปภาพต้นฉบับจากฮาร์ดดิสก์
      const fileBuffer = await fs.readFile(fileRecord.storagePath);

      // 2. แปลงไฟล์ภาพเป็นรหัส Base64 (วิธีนี้ชัวร์และเสถียรที่สุดในการส่งข้ามเซิร์ฟเวอร์)
      const base64Image = fileBuffer.toString('base64');

      // 3. ส่งคำสั่ง API ไปให้ AI จัดการในรูปแบบ JSON
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_file_b64: base64Image,
          size: 'auto',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${errorData.errors?.[0]?.title || response.statusText}`);
      }

      // 4. รับไฟล์ภาพที่ตัดแล้วกลับมา (เป็น Binary Buffer)
      const arrayBuffer = await response.arrayBuffer();
      const resultBuffer = Buffer.from(arrayBuffer);

      // 5. บันทึกไฟล์ PNG ลงในฮาร์ดดิสก์ของเรา
      await fs.writeFile(outputPath, resultBuffer);

      const updatedJob = await this.prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', resultUrl: `/uploads/processed/${newFileName}` }
      });

      await this.prisma.fileMetadata.update({
        where: { id: fileId },
        data: { isProcessed: true, jobId: job.id }
      });

      return { jobId: updatedJob.id, status: updatedJob.status, resultUrl: updatedJob.resultUrl };
    } catch (error: any) {
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', errorMessage: error.message }
      });
      // โยน Error กลับไปให้หน้าเว็บเห็นชัดๆ ว่าเกิดจากอะไร
      throw new InternalServerErrorException(`AI ตัดพื้นหลังล้มเหลว: ${error.message}`);
    }


  }

  async mergePdf(
    dto: CreatePdfMergeJobDto,
    userId: string,
  ) {
    const { fileIds } = dto;

    const files = await this.prisma.fileMetadata.findMany({
      where: {
        id: {
          in: fileIds,
        },
        userId: userId,
      },
    });

    if (files.length !== fileIds.length) {
      throw new BadRequestException(
        'พบไฟล์ที่ไม่มีในระบบ หรือคุณไม่มีสิทธิ์เข้าถึง',
      );
    }

    const orderedFiles = fileIds.map(
      (id) => files.find((file) => file.id === id)!,
    );

    const job = await this.prisma.processingJob.create({
      data: {
        toolCode: 'PDF_MERGE',
        userId: userId,
        status: 'PROCESSING',
      },
    });

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of orderedFiles) {
        const fileBuffer = await fs.readFile(
          file.storagePath,
        );

        const pdfDoc =
          await PDFDocument.load(fileBuffer);

        const copiedPages =
          await mergedPdf.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices(),
          );

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const pdfBytes = await mergedPdf.save();

      const newFileName =
        `merged-document-${Date.now()}.pdf`;

      const outputPath = path.join(
        this.processedDir,
        newFileName,
      );

      await fs.writeFile(
        outputPath,
        pdfBytes,
      );

      const updatedJob =
        await this.prisma.processingJob.update({
          where: {
            id: job.id,
          },
          data: {
            status: 'COMPLETED',
            resultUrl:
              `/uploads/processed/${newFileName}`,
          },
        });

      await this.prisma.fileMetadata.updateMany({
        where: {
          id: {
            in: fileIds,
          },
        },
        data: {
          isProcessed: true,
          jobId: job.id,
        },
      });

      return {
        jobId: updatedJob.id,
        status: updatedJob.status,
        resultUrl: updatedJob.resultUrl,
      };

    } catch (error: any) {

      await this.prisma.processingJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      throw new InternalServerErrorException(
        `รวมไฟล์ PDF ล้มเหลว: ${error.message}`,
      );
    }
  }

  // 🚀 ----------------------------------------------------
  // ระบบแยกหน้าไฟล์ PDF (Split PDF)
  // ให้เอาโค้ดนี้ไปวางต่อท้ายฟังก์ชัน mergePdf ในคลาส JobsService ครับ
  // -------------------------------------------------------
  async splitPdf(dto: CreatePdfSplitJobDto, userId: string) {
    const { fileId, pages } = dto;

    const file = await this.prisma.fileMetadata.findFirst({
      where: { id: fileId, userId: userId }
    });

    if (!file) throw new NotFoundException('ไม่พบไฟล์ที่ต้องการแยกหน้า');

    const job = await this.prisma.processingJob.create({
      data: { toolCode: 'PDF_SPLIT', userId: userId, status: 'PROCESSING' }
    });

    try {
      const fileBuffer = await fs.readFile(file.storagePath);
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const totalPages = pdfDoc.getPageCount();

      // 1. แปลงเลขหน้าให้ตรงกับ Index ของระบบ (เริ่มที่ 0) และกรองหน้าที่ไม่มีอยู่ออก
      const validIndices = pages
        .filter(p => p > 0 && p <= totalPages)
        .map(p => p - 1);

      if (validIndices.length === 0) {
        throw new BadRequestException('ไม่พบหน้าที่ระบุในเอกสารนี้');
      }

      // 2. สร้าง PDF ใหม่ และก๊อปปี้เฉพาะหน้าที่เลือกมาใส่
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, validIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      // 3. บันทึกเป็นไฟล์ใหม่
      const pdfBytes = await newPdf.save();
      const newFileName = `split-document-${Date.now()}.pdf`;
      const outputPath = path.join(this.processedDir, newFileName);
      await fs.writeFile(outputPath, pdfBytes);

      // 4. อัปเดตสถานะงาน
      const updatedJob = await this.prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', resultUrl: `/uploads/processed/${newFileName}` }
      });

      await this.prisma.fileMetadata.update({
        where: { id: fileId },
        data: { isProcessed: true, jobId: job.id }
      });

      return { jobId: updatedJob.id, status: updatedJob.status, resultUrl: updatedJob.resultUrl };
    } catch (error: any) {
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', errorMessage: error.message }
      });
      throw new InternalServerErrorException(`แยกหน้าไฟล์ PDF ล้มเหลว: ${error.message}`);
    }
  }
}