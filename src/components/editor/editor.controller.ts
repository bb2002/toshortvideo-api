import {
  BadRequestException,
  Body,
  Controller,
  Ip,
  ParseArrayPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EditorService } from './services/editor.service';
import storage from '../../common/multer/videoUploaderDiskStorage';
import { FileInterceptor } from '@nestjs/platform-express';
import { EnqueueVideoDto } from './dto/enqueueVideo.dto';

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

  @Post('/enqueue')
  async enqueueVideos(
    @Body(new ParseArrayPipe({ items: EnqueueVideoDto }))
    enqueueVideoDto: EnqueueVideoDto[],
    @Ip() ipAddr,
  ) {
    if (!ipAddr) {
      throw new BadRequestException('Invalid client request.');
    }

    const { uuid } = await this.editorService.enqueueVideos(
      ipAddr,
      enqueueVideoDto,
    );

    return {
      uuid,
    };
  }
}
