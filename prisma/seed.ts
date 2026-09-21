// ไฟล์: toolsbox-backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// รายการเครื่องมือต่างๆ ที่เราจะเพิ่มเข้าไปใน Database
const toolsData = [
  {
    code: 'IMG_CONVERTER',
    name: 'แปลงนามสกุลรูปภาพ (Image Converter)',
    description: 'แปลงไฟล์รูปภาพระหว่าง JPEG, PNG, และ WEBP คุณภาพสูง',
    category: 'MULTIMEDIA',
    isActive: true,
  },
  {
    code: 'IMG_COMPRESSOR',
    name: 'ลดขนาดรูปภาพ (Image Compressor)',
    description: 'บีบอัดขนาดไฟล์รูปภาพให้เล็กลง โดยไม่เสียความละเอียด',
    category: 'MULTIMEDIA',
    isActive: true,
  },
  {
    code: 'IMG_REMOVE_BG',
    name: 'ลบพื้นหลังรูปภาพ (AI Remove BG)',
    description: 'ไดคัทและตัดพื้นหลังรูปภาพอัตโนมัติด้วยระบบ AI อัจฉริยะ',
    category: 'MULTIMEDIA',
    isActive: true,
  },
  {
    code: 'PDF_MERGE',
    name: 'รวมไฟล์ PDF (Merge PDF)',
    description: 'รวมไฟล์ PDF หลายไฟล์ให้เป็นไฟล์เอกสารฉบับเดียวอย่างรวดเร็ว',
    category: 'DOCUMENT',
    isActive: true,
  },
  {
    code: 'PDF_SPLIT',
    name: 'แยกหน้า PDF (Split PDF)',
    description: 'แยกหน้าเอกสาร PDF หรือดึงเฉพาะหน้าที่ต้องการออกมา',
    category: 'DOCUMENT',
    isActive: true,
  },
  {
    code: 'CODE_FORMATTER',
    name: 'จัดระเบียบโค้ด (Code Beautifier)',
    description: 'จัดหน้าตาและ Indent ซอร์สโค้ด (JSON, HTML, JS) ให้อ่านง่าย',
    category: 'CODE',
    isActive: true,
  },
  {
    code: 'BASE64_TOOL',
    name: 'เข้ารหัส / ถอดรหัส Base64',
    description: 'แปลงข้อความหรือไฟล์เป็น Base64 String สำหรับนักพัฒนา',
    category: 'UTILITY',
    isActive: true,
  },
];

async function main() {
  console.log('🌱 กำลังเริ่มรัน Seed ข้อมูลเครื่องมือ (Tools) เข้า Database...');

  for (const tool of toolsData) {
    // ใช้ upsert: ถ้ามีอยู่แล้วให้อัปเดตข้อมูล ถ้ายังไม่มีให้สร้างใหม่ (ป้องกัน Error ซ้ำซ้อน)
    await prisma.tool.upsert({
      where: { code: tool.code },
      update: {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        isActive: tool.isActive,
      },
      create: {
        code: tool.code,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        isActive: tool.isActive,
      },
    });
    console.log(`✅ เพิ่ม/อัปเดตเครื่องมือ: [${tool.category}] ${tool.name}`);
  }

  console.log('🎉 Seeding สำเร็จเรียบร้อยครบทุกรายการ!');
}

main()
  .catch((e) => {
    console.error('❌ เกิดข้อผิดพลาดขณะ Seed ข้อมูล:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });