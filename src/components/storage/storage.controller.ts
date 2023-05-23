import {
  Controller,
  ForbiddenException,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { MetadataService } from '../metadata/metadata.service';
import { validateIsSupportVideo } from './utils/validateIsSupportVideo';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly metadataService: MetadataService,
  ) {}

  @Put()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'tmp',
        filename: (req, file, cb) => {
          if (validateIsSupportVideo(file)) {
            cb(null, uuidv4());
          } else {
            cb(new ForbiddenException('Not support file'), null);
          }
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 1024 * 2,
      },
    }),
  )
  async putFile(@UploadedFile() file: Express.Multer.File) {
    const { filename } = file;

    // Cloudflare R2 에 업로드
    await this.storageService.putFileFromTmpFolder(filename);

    // TODO 디비에 저장 정보 업로드
    // TODO Metadata 추출해서 디비에 저장하는 코드 추가

    return filename;
  }
}
