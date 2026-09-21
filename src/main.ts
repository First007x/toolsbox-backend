// ไฟล์: src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Security: ติดตั้ง Helmet แต่ต้องปลดล็อกนโยบาย Cross-Origin เพื่อให้หน้าเว็บดึงรูปไปแสดงได้
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // 2. API Standard: ตั้งค่า Prefix เป็น /api/v1 ตามข้อกำหนด
  app.setGlobalPrefix('api/v1');

  // 3. Validation: ตรวจสอบ Payload ของ Request เสมอ (ป้องกัน Injection เบื้องต้น)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ตัด property ที่ไม่ได้กำหนดใน DTO ทิ้ง (ป้องกัน Mass Assignment)
      transform: true, // แปลง Type อัตโนมัติ (เช่น String เป็น Number)
    }),
  );

  // 4. Error Handling: บังคับรูปแบบ Error Response ให้เป็นมาตรฐาน { success: false, ... }
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 5. Response Formatting: แปลง Response JSON keys เป็น snake_case อัตโนมัติ
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  // 6. CORS: อนุญาตเฉพาะ Frontend ของเราเท่านั้น (ในการ Production ควรระบุ URL ชัดเจน)
  app.enableCors({
    origin: '*', // [ASSUMPTION] เปลี่ยนเป็น URL ของ Frontend ตอนขึ้น Prod
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3001); // รันพอร์ต 3001 เพื่อไม่ให้ชนกับ Frontend (3000)
}
bootstrap();