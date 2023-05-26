import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { FfmpegResultDto } from '../dto/ffmpegResult.dto';
import transformAndValidate from '../../../common/utils/transformAndValidate';
import { renameTmpFile } from '../../../common/utils/renameFile';

@Injectable()
export class FfmpegService {
  async generateThumbnail(videoPath: string, thumbnailName: string) {
    return new Promise<string>((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => {
          renameTmpFile(`${thumbnailName}.png`, thumbnailName)
            .then(() => {
              resolve(thumbnailName);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .on('error', (err) => {
          reject(err);
        })
        .screenshots({
          timestamps: ['50%'],
          filename: thumbnailName,
          folder: 'tmp',
          count: 1,
        });
    });
  }

  async generateMetadata(videoPath: string): Promise<FfmpegResultDto> {
    const raw = await new Promise<ffmpeg.FfprobeFormat>((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format);
        }
      });
    });

    return transformAndValidate(FfmpegResultDto, {
      bitRate: raw.bit_rate,
      size: raw.size,
      duration: raw.duration,
    });
  }
}
