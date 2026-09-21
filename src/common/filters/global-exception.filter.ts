// ไฟล์: src/common/filters/global-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * จัดการ Error ทั้งหมดในระบบให้ตอบกลับในรูปแบบ: { success: false, error: ... }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || res;
    } else if (exception instanceof Error) {
      message = exception.message;
      // [Security] ใน Production ไม่ควรคืนค่า Error Trace ออกไปให้ Client
    }

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message: Array.isArray(message) ? message[0] : message, // กรณี Validation Error จะส่งกลับข้อความแรก
        details: Array.isArray(message) ? message : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}