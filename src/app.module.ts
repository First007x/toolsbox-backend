// ไฟล์: src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ToolsModule } from './modules/tools/tools.module';
import { FilesModule } from './modules/files/files.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ServeStaticModule } from '@nestjs/serve-static'; 
import { join } from 'path'; 
import { ScheduleModule } from '@nestjs/schedule'; 
import { TasksModule } from './modules/tasks/tasks.module'; 

@Module({
  imports: [
    ScheduleModule.forRoot(),

    // แก้ไข: ใช้ process.cwd() เพื่อให้พิกัดตรงกับตอนเซฟไฟล์ 100%
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads', 
    }),

    PrismaModule,
    ToolsModule,
    FilesModule,
    JobsModule, 
    TasksModule, 
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}