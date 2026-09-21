// ไฟล์: src/modules/files/files.module.ts
import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService], // Export ไว้เผื่อ Module อื่นต้องการใช้
})
export class FilesModule {}