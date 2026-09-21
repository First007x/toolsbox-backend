// ไฟล์: src/common/utils/file-security.util.ts
import * as path from 'path';

/**
 * Security Directive: Never trust uploaded files.
 * ไฟล์นี้จะเป็นศูนย์รวม Logic การตรวจสอบความปลอดภัยของไฟล์
 */

// รายการ Extension และ MIME Type ที่อนุญาตเบื้องต้น
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf'];

export class FileSecurityUtil {
  
  /**
   * สร้างชื่อไฟล์ใหม่เสมอ ห้ามใช้ชื่อเดิมของผู้ใช้เด็ดขาด (ป้องกัน Path Traversal & Injection)
   */
  static generateSafeFileName(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15); // ใช้สำหรับชื่อไฟล์ชั่วคราวได้
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * ตรวจสอบ MIME Type เบื้องต้น
   */
  static isValidMimeType(mimeType: string, type: 'image' | 'document'): boolean {
    if (type === 'image') return ALLOWED_IMAGE_TYPES.includes(mimeType);
    if (type === 'document') return ALLOWED_DOC_TYPES.includes(mimeType);
    return false;
  }

  // TODO: ในอนาคตจะมีการทำ Magic Bytes Checking ด้วย library 'file-type' 
  // เพื่อตรวจสอบ Header ของไฟล์จริงๆ ไม่ใช่แค่ตรวจจาก Extension
}