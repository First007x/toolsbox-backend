// ไฟล์: src/common/guards/gateway-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Security Directive: Never bypass the Gateway.
 * Guard นี้จะทำหน้าที่ตรวจสอบว่า Request มาจาก API Gateway หรือไม่
 * โดยอ่านค่า X-User-Id ที่ถูก Inject มาจาก Gateway เท่านั้น (ไม่มีการตรวจ JWT เอง)
 */
@Injectable()
export class GatewayAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // ดึงค่า Header ที่ API Gateway ส่งมาให้
    const userId = request.headers['x-user-id'];
    const role = request.headers['x-layer1-role'];
    const faculty = request.headers['x-faculty'];

    // หากไม่มี X-User-Id แสดงว่าพยายาม Bypass Gateway หรือ Gateway ตั้งค่าผิด
    if (!userId) {
      throw new UnauthorizedException('Unauthorized: Missing Gateway Identity (X-User-Id)');
    }

    // แปะข้อมูล User ลงใน Request เพื่อให้ Controller นำไปใช้ต่อ (เช่นบันทึกลง ProcessingJob)
    request.user = {
      id: userId,
      role: role || 'USER', // Default เป็น USER หากไม่มี Role
      faculty: faculty || null,
    };

    return true;
  }
}