import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConverterService } from './converter.service';
import { ConvertOrderEntity } from '../entities/convertOrder.entity';
import { v4 as uuidv4 } from 'uuid';
import { EnqueueVideoDto } from 'src/components/editor/dto/enqueueVideo.dto';
import { plainToInstance } from 'class-transformer';
import * as path from 'path';
import * as fs from 'fs';
import VideoResolution from 'src/common/constants/VideoResolution';
import { spawn } from 'child_process';
import VideoSize from '../enums/VideoSize';
import VideoBlankFill from '../enums/VideoBlankFill';

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

    await Promise.all(
      item.orders.map(async (i) => {
        const order = await this.converterService.getOrderById(i.id);
        if (order.originalVideo.expiredAt > new Date()) {
          await this.runEditly(order);
        } else {
          // TODO 만료되었으므로 Error 처리
        }
      }),
    );
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

    let top = 0.25;
    switch (recipe.video.videoSize) {
      case VideoSize.FULL:
        top = 0;
        break;
      case VideoSize.BIG:
        top = 0.255;
        break;
      case VideoSize.MIDDLE:
        top = 0.25;
        break;
    }

    let resizeMode = 'contain-blur';
    switch (recipe.video.blankFill) {
      case VideoBlankFill.BLACK:
        resizeMode = 'cover';
        break;
      case VideoBlankFill.BLUR:
        resizeMode = 'contain-blur';
        break;
    }

    const layers = [
      {
        type: 'video',
        path: originalVideo.downloadUrl,
        cutFrom: recipe.video.startAt,
        cutTo: recipe.video.endAt,
        height: recipe.video.videoSize,
        top,
        resizeMode,
      },
    ] as any[];

    if (recipe.text1) {
      layers.push({
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
      });
    }

    if (recipe.text2) {
      layers.push({
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
      });
    }

    const spec = {
      outPath: outputFilePath,
      width: videoResolution[0],
      height: videoResolution[1],
      allowRemoteRequests: true,
      fps: 30,
      clips: [
        {
          layers,
        },
      ],
    };

    const specFilePath = await new Promise<string>((resolve, reject) => {
      const jsonFilePath = path.join('tmp', `${outputFileName}-spec.json`);
      fs.writeFile(jsonFilePath, JSON.stringify(spec), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(jsonFilePath);
        }
      });
    });

    const editlyProcess = spawn('editly', [
      specFilePath,
      '--fast',
      '--keep-source-audio',
      '--out',
      outputFilePath,
    ]);

    editlyProcess.on('data', (data) => {
      console.log('EDITLY DATA: ', data);
    });

    editlyProcess.on('error', (err) => {
      console.error('EDITLY ERR: ', err);
    });

    editlyProcess.on('close', (code) => {
      console.log('EDITLY CLOSE: ', code);
    });
  }
}
