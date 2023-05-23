import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class MetadataService {
  async getVideoThumbnail(filePath: string) {
    ffmpeg(filePath)
      .on('filenames', (filenames) => {
        console.log('Will generate ' + filenames.join(', '));
      })
      .on('end', () => {
        console.log('Screenshots taken');
      })
      .on('error', (err) => {
        console.log(err);
      })
      .screenshot({
        count: 1,
        folder: 'test',
        filename: 'thumbnail.png',
      });
  }

  async getVideoDuration(filePath: string) {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      console.log('DURATION: ', metadata.format.duration);
    });
  }
}
