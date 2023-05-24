import {
  Inject,
  Injectable,
  InternalServerErrorException,
  forwardRef,
} from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { MetadataEntity } from './entities/metadata.entity';
import { Repository } from 'typeorm';
import { StorageService } from '../storage/storage.service';
import { isFileExists } from '../../common/utils/isFileExists';
import { renameTmpFile } from 'src/common/utils/renameFile';

@Injectable()
export class MetadataService {
  constructor(
    @Inject(forwardRef(() => StorageService))
    private readonly storageService: StorageService,
    @InjectRepository(MetadataEntity)
    private readonly metadataRepository: Repository<MetadataEntity>,
  ) {}

  async createMetadataFromFile(filePath: string) {
    if (!(await isFileExists(filePath))) {
      throw new InternalServerErrorException('No temporary files were found.');
    }

    const thumbnailUrl = await this.createThumbnail(filePath);
    const { duration } = await this.parseVideoMetadata(filePath);

    return this.metadataRepository.save({
      videoThumbnail: thumbnailUrl,
      duration,
    });
  }

  async createThumbnail(filePath: string) {
    if (!(await isFileExists(filePath))) {
      throw new InternalServerErrorException('No temporary files were found.');
    }

    const thumbnailFileName = await this.parseVideoThumbnail(filePath);

    // TODO 썸네일 이미지를 압축하는 로직 추가

    const { key } = await this.storageService.uploadFileToStorage(
      thumbnailFileName,
    );

    const { url } = await this.storageService.generateDownloadUrl(key);

    this.storageService.deleteTmpFile(thumbnailFileName);

    return url;
  }

  private async parseVideoThumbnail(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const uuid = uuidv4();

      ffmpeg(filePath)
        .on('end', () => {
          renameTmpFile(`${uuid}.png`, uuid)
            .then(() => {
              resolve(uuid);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .on('error', (err) => {
          reject(err);
        })
        .screenshot({
          count: 1,
          timestamps: ['50%'],
          folder: 'tmp',
          filename: uuid,
        });
    });
  }

  private async parseVideoMetadata(
    filePath: string,
  ): Promise<ffmpeg.FfprobeFormat> {
    return new Promise<ffmpeg.FfprobeFormat>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format);
        }
      });
    });
  }
}
