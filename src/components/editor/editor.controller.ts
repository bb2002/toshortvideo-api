import {
  BadRequestException,
  Controller,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EditorService } from './services/editor.service';
import storage from '../../common/multer/videoUploaderDiskStorage';
import { FileInterceptor } from '@nestjs/platform-express';

const MAX_VIDEO_UPLOAD_SIZE = 2; // GB

@Controller('editor')
export class EditorController {
  constructor(private readonly editorService: EditorService) {}

  @Put('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storage,
      limits: {
        fileSize: 1024 * 1024 * 1024 * MAX_VIDEO_UPLOAD_SIZE,
      },
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.editorService.processUploadedVideo(file);
  }
}
