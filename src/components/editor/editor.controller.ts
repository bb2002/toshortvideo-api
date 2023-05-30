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
import { CreateOrderItemDto } from './dto/createOrderItem.dto';
import transformAndValidate from '../../common/utils/transformAndValidate';
import { CreateOrderDto } from './dto/createOrder.dto';

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
  async enqueueOrder(
    @Body(new ParseArrayPipe({ items: CreateOrderItemDto }))
    orderItems: CreateOrderItemDto[],
    @Ip() ipAddr: string,
  ) {
    const createOrderDto = await transformAndValidate(CreateOrderDto, {
      ipAddress: ipAddr,
      orderItems,
    });

    return this.editorService.enqueueOrder(createOrderDto);
  }
}
