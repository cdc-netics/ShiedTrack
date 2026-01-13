import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  imports: [
    MongooseModule.forFeature([]),
  ],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
