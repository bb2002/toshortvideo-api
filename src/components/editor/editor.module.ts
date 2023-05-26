import { Module } from '@nestjs/common';
import { EditorController } from './editor.controller';
import { EditorService } from './services/editor.service';
import { FfmpegService } from './services/ffmpeg.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadVideoEntity } from './entities/uploadVideo.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  controllers: [EditorController],
  providers: [EditorService, FfmpegService],
  exports: [EditorService, FfmpegService],
  imports: [StorageModule, TypeOrmModule.forFeature([UploadVideoEntity])],
})
export class EditorModule {}
