import { forwardRef, Module } from '@nestjs/common';
import { EditorController } from './editor.controller';
import { EditorService } from './services/editor.service';
import { FfmpegService } from './services/ffmpeg.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadVideoEntity } from './entities/uploadVideo.entity';
import { StorageModule } from '../storage/storage.module';
import { ConverterModule } from '../converter/converter.module';

@Module({
  controllers: [EditorController],
  providers: [EditorService, FfmpegService],
  exports: [EditorService, FfmpegService],
  imports: [
    forwardRef(() => ConverterModule),
    StorageModule,
    TypeOrmModule.forFeature([UploadVideoEntity]),
  ],
})
export class EditorModule {}
