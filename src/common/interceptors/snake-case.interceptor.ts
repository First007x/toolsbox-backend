// ไฟล์: src/common/interceptors/snake-case.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import snakecaseKeys from 'snakecase-keys';

/**
 * แปลงข้อมูลใน Response Data ที่เป็น camelCase (ของ JS/TS)
 * ให้กลายเป็น snake_case ตาม API Convention ที่กำหนด
 */
@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // จัดรูปแบบ Standard Response { success, data, meta }
        const formattedResponse = {
          success: true,
          data: data?.data ? data.data : data, // หาก Controller หุ้ม data มาแล้วก็ใช้ต่อ
          meta: data?.meta || { timestamp: new Date().toISOString() },
        };

        // แปลงทุก Key ให้เป็น snake_case (ไม่แปลงลึกถึงระดับ Date หรือ RegExp)
        return snakecaseKeys(formattedResponse, { deep: true });
      }),
    );
  }
}