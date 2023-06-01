import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConverterService } from './converter.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import VideoSize from '../enums/VideoSize';
import VideoBlankFill from '../enums/VideoBlankFill';
import { UploadVideoEntity } from '../../editor/entities/uploadVideo.entity';
import { EditorService } from '../../editor/services/editor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ConvertOrderItemEntity } from '../entities/convertOrderItem.entity';
import { Repository } from 'typeorm';
import ProgressStatus from '../enums/ProgressStatus';
import ConvertErrorMessage from '../enums/ConvertErrorMessage';
import transformAndValidate from '../../../common/utils/transformAndValidate';
import { EncodingRecipeDto } from '../dto/encodingRecipe.dto';
import FontFamily from '../enums/FontFamily';
import { FontWeight } from '../enums/FontWeight';

interface GenerateEditlySpecFileParams {
  orderItemEntity: ConvertOrderItemEntity;
  uploadVideoEntity: UploadVideoEntity;
}

interface StartEditlyParams {
  orderItemEntity: ConvertOrderItemEntity;
  specFilePath: string;
}

@Injectable()
export class EditlyService {
  private readonly logger = new Logger(EditlyService.name);

  constructor(
    private readonly converterService: ConverterService,
    private readonly editorService: EditorService,
    @InjectRepository(ConvertOrderItemEntity)
    private readonly convertOrderItemRepository: Repository<ConvertOrderItemEntity>,
  ) {}

  @Interval(2000)
  handleInterval() {
    this.convert()
      .then()
      .catch((ex) => this.logger.error(ex));
  }

  private async convert() {
    const order = await this.converterService.dequeueOrder();
    if (!order) {
      return;
    }

    for (const orderItem of order.items) {
      const { videoUUID } = orderItem;
      const uploadedVideo = await this.editorService.getUploadVideo(videoUUID);
      if (uploadedVideo) {
        orderItem.status = ProgressStatus.IN_PROGRESS;
        orderItem.rate = 0;
        await this.convertOrderItemRepository.save(orderItem);
      } else {
        orderItem.status = ProgressStatus.ERROR;
        orderItem.message = ConvertErrorMessage.STARTING_TOOK_TOO_LONG;
        await this.convertOrderItemRepository.save(orderItem);
        continue;
      }

      // 동영상 편집을 위한 스팩 파일 생성
      const specFilePath = await this.generateEditlySpecFile({
        orderItemEntity: orderItem,
        uploadVideoEntity: uploadedVideo,
      });

      this.startEditly({ orderItemEntity: orderItem, specFilePath }).then();
    }
  }

  private async generateEditlySpecFile({
    orderItemEntity,
    uploadVideoEntity,
  }: GenerateEditlySpecFileParams): Promise<string> {
    const { videoUUID, recipe } = orderItemEntity;
    const { downloadUrl } = uploadVideoEntity;
    const specFilePath = path.join('tmp', `${uuidv4()}.json`);
    const encodingRecipeDto = await transformAndValidate(
      EncodingRecipeDto,
      JSON.parse(recipe),
    );
    const editlySpecTop = (() => {
      switch (encodingRecipeDto.video.videoSize) {
        case VideoSize.FULL:
          return 0;
        case VideoSize.BIG:
          return 0.255;
        case VideoSize.MIDDLE:
          return 0.25;
      }
    })();
    const editlySpecResizeMode = () => {
      switch (encodingRecipeDto.video.blankFill) {
        case VideoBlankFill.BLACK:
          return 'cover';
        case VideoBlankFill.BLUR:
        default:
          return 'contain-blur';
      }
    };
    const editlyFoneFilePath = (font: FontFamily, weight: FontWeight) => {
      return path.join('fonts', `${font}${weight}.otf`);
    };

    const editlySpec = {
      outPath: path.join('tmp', videoUUID),
      width: 1080,
      height: 1920,
      allowRemoteRequests: true,
      fps: 30,
      clips: [
        {
          type: 'video',
          path: downloadUrl,
          cutFrom: encodingRecipeDto.video.startAt,
          cutTo: encodingRecipeDto.video.endAt,
          height: encodingRecipeDto.video.videoSize,
          top: editlySpecTop,
          resizeMode: editlySpecResizeMode,
        },
        encodingRecipeDto.text1 ?? {
          type: 'title',
          text: encodingRecipeDto.text1.text,
          position: {
            originX: 'center',
            originY: 'top',
            x: 0.5,
            y: 0.06,
          },
          textColor: encodingRecipeDto.text1.color,
          fontPath: editlyFoneFilePath(
            encodingRecipeDto.text1.font,
            encodingRecipeDto.text1.weight,
          ),
          zoomAmount: null,
        },
        encodingRecipeDto.text2 ?? {
          type: 'title',
          text: encodingRecipeDto.text2.text,
          position: {
            originX: 'center',
            originY: 'top',
            x: 0.5,
            y: 0.12,
          },
          textColor: encodingRecipeDto.text2.color,
          fontPath: editlyFoneFilePath(
            encodingRecipeDto.text2.font,
            encodingRecipeDto.text2.weight,
          ),
          zoomAmount: null,
        },
      ],
    };

    return new Promise<string>((resolve, reject) => {
      fs.writeFile(specFilePath, JSON.stringify(editlySpec), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(specFilePath);
        }
      });
    });
  }

  private async startEditly({
    orderItemEntity,
    specFilePath,
  }: StartEditlyParams) {
    return new Promise<void>((resolve, reject) => {
      const editlyProcess = spawn('editly', [
        specFilePath,
        '--fast',
        '--keep-source-audio',
      ]);

      editlyProcess.on('data', (data) => {
        console.log('EDITLY DATA: ', data);
      });

      editlyProcess.on('error', (err) => {
        console.error('EDITLY ERR: ', err);
      });

      editlyProcess.on('close', (code) => {
        console.log('EDITLY CLOSE: ', code);
        resolve();
      });
    });
  }
}
