import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConverterService } from './converter.service';
import { ConvertOrderEntity } from '../entities/convertOrder.entity';
import editly from 'editly';
import { v4 as uuidv4 } from 'uuid';
import { EnqueueVideoDto } from 'src/components/editor/dto/enqueueVideo.dto';
import { plainToInstance } from 'class-transformer';
import * as path from 'path';
import VideoResolution from 'src/common/constants/VideoResolution';

@Injectable()
export class EditlyService {
  private readonly logger = new Logger(EditlyService.name);

  constructor(private readonly converterService: ConverterService) {}

  @Interval(2000)
  handleInterval() {
    this.convert()
      .then()
      .catch((ex) => this.logger.error(ex));
  }

  private async convert() {
    const item = await this.converterService.dequeue();
    if (!item) {
      return null;
    }

    await Promise.all(item.orders.map((value) => this.runEditly(value)));
  }

  private async runEditly(order: ConvertOrderEntity) {
    const { originalVideo } = order;
    const { recipe } = plainToInstance(
      EnqueueVideoDto,
      JSON.parse(order.recipe),
    );
    const outputFileName = uuidv4();
    const outputFilePath = path.join('tmp', outputFileName);
    const videoResolution = VideoResolution[recipe.platform];
    let top = (1 - recipe.video.size) / 2;
    if (top > 0) {
      top += 0.06;
    }

    await editly({
      outPath: outputFilePath,
      width: videoResolution[0],
      height: videoResolution[1],
      allowRemoteRequests: true,
      fps: 30,
      clips: [
        {
          layers: [
            {
              type: 'video',
              path: originalVideo.downloadUrl,
              cutFrom: recipe.video.startAt,
              cutTo: recipe.video.endAt,
              height: recipe.video.size,
              top,
              resizeMode: 'cover',
              mixVolume: 1,
            },
            recipe.text1 && {
              type: 'title',
              text: recipe.text1.text,
              position: {
                originX: 'center',
                originY: 'top',
                x: 0.5,
                y: 0.06,
              },
              textColor: recipe.text1.color,
              zoomAmount: null,
            },
            recipe.text2 && {
              type: 'title',
              text: recipe.text2.text,
              position: {
                originX: 'center',
                originY: 'top',
                x: 0.5,
                y: 0.12,
              },
              textColor: recipe.text2.color,
              zoomAmount: null,
            },
          ],
        },
      ],
    });

    return outputFileName;
  }
}
