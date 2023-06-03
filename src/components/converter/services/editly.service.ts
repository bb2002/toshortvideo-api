import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConverterService } from './converter.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
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
import { ExportService } from './export.service';

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
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    private readonly exportSerivce: ExportService,
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

      this.startEditly({ orderItemEntity: orderItem, specFilePath })
        .then(() => this.onEditlyCompleted(orderItem, uploadedVideo))
        .catch((ex) => {
          orderItem.status = ProgressStatus.ERROR;
          orderItem.message = ex;
          orderItem.completedAt = new Date();
          this.convertOrderItemRepository.save(orderItem);
        });
    }
  }

  private async onEditlyCompleted(
    orderItem: ConvertOrderItemEntity,
    uploadedVideo: UploadVideoEntity,
  ) {
    orderItem.status = ProgressStatus.COMPLETED;
    orderItem.rate = 100;
    orderItem.completedAt = new Date();
    await this.convertOrderItemRepository.save(orderItem);

    // 비디오를 다운로드 가능하도록 출력
    const resultItem = await this.exportSerivce.createExport({
      orderItemEntity: orderItem,
      uploadVideoEntity: uploadedVideo,
    });

    await this.exportSerivce.startExport({
      resultItem,
      videoFileName: `${uploadedVideo.uuid}.mp4`,
    });
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

    const layers: any[] = [
      {
        type: 'video',
        path: downloadUrl,
        cutFrom: encodingRecipeDto.video.startAt,
        cutTo: encodingRecipeDto.video.endAt,
        height: encodingRecipeDto.video.videoSize,
        top: editlySpecTop,
        resizeMode: editlySpecResizeMode,
      },
    ];

    if (encodingRecipeDto.text1) {
      layers.push({
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
      });
    }

    if (encodingRecipeDto.text2) {
      layers.push({
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
      });
    }

    const editlySpec = {
      outPath: path.join('tmp', `${videoUUID}.mp4`),
      width: 1080,
      height: 1920,
      allowRemoteRequests: true,
      fps: 30,
      clips: [
        {
          layers,
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
    const saveOrderItemEntity = (e: ConvertOrderItemEntity) => {
      this.convertOrderItemRepository.save(e);
    };

    return new Promise<void>((resolve, reject) => {
      const timeoutHandler = setTimeout(() => {
        reject(ConvertErrorMessage.ENCODING_TOOK_TOO_LONG);
      }, 60 * 10 * 1000);

      let editlyProcess: ChildProcessWithoutNullStreams;
      try {
        editlyProcess = spawn('editly', [
          specFilePath,
          '--fast',
          '--keep-source-audio',
        ]);

        editlyProcess.stdout.on('data', (buf) => {
          const data = buf.toString() as string;
          console.log('stdout:', data);

          if (data.indexOf('Done.') !== -1) {
            // 인코딩이 성공적으로 완료된 경우
            clearTimeout(timeoutHandler);
            resolve();
          }

          if (data.indexOf('%') !== -1) {
            // 인코딩이 진행중인 경우
            const rate = parseInt(data);
            orderItemEntity.rate = rate;
            saveOrderItemEntity(orderItemEntity);
          }
        });

        editlyProcess.stderr.on('data', (err) => {
          // 인코딩 중 오류가 발생한 경우
          clearTimeout(timeoutHandler);
          this.logger.error(err.toString());
          reject(ConvertErrorMessage.INTERNAL_SERVER_ERROR);
        });
      } catch (err) {
        this.logger.error(err);
        reject(ConvertErrorMessage.INTERNAL_SERVER_ERROR);
      }
    });
  }
}
