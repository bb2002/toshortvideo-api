import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { MetadataEntity } from './entities/metadata.entity';
import { Repository } from 'typeorm';
import isFileExists from '../../common/utils/isFileExists';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(MetadataEntity)
    private readonly metadataRepository: Repository<MetadataEntity>,
  ) {}

  async createMetadataFromFile(filePath: string) {
    if (!isFileExists(filePath)) {
      throw new InternalServerErrorException('No temporary files were found.');
    }

    const videoThumbnail = await this.parseVideoThumbnail(filePath);
    const { duration } = await this.parseVideoMetadata(filePath);

    return this.metadataRepository.save({
      videoThumbnail,
      duration,
    });
  }

  private async parseVideoThumbnail(filePath: string) {
    return new Promise<string>((resolve, reject) => {
      const uuid = uuidv4();

      ffmpeg(filePath)
        .on('end', () => {
          resolve(path.join('tmp', uuid));
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
