import { Module } from '@nestjs/common';
import { VideoEditorService } from './video-editor.service';

@Module({
  providers: [VideoEditorService],
  exports: [VideoEditorService],
})
export class VideoEditorModule {}
