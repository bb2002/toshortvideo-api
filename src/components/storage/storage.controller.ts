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
    const { path, filename, size, mimetype, originalname } = file;

    // Metadata 생성
    const metadataEntity = await this.metadataService.createMetadataFromFile(
      path,
    );

    // File 생성
    const { uuid } = await this.storageService.registerFile({
      fileSize: size,
      uuid: filename,
      mimeType: mimetype,
      originalName: originalname,
      metadata: metadataEntity,
    });

    // Cloudflare R2 에 업로드
    const { key } = await this.storageService.uploadFileToStorage(filename);

    // Download URL 생성
    const { url, expiredAt } = await this.storageService.generateDownloadUrl(
      key,
    );

    // DownloadUrl 등록
    await this.storageService.updateFile({ uuid, downloadUrl: url, expiredAt });

    // TODO 임시 파일 삭제하는 로직 추가

    return filename;
  }
}
