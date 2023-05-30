import { BadRequestException, Injectable } from '@nestjs/common';
import { FfmpegService } from './ffmpeg.service';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../../storage/storage.service';
import R2Folder from '../../storage/enums/R2Folder';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadVideoEntity } from '../entities/uploadVideo.entity';
import { In, MoreThan, Repository } from 'typeorm';
import { CreateOrderItemDto } from '../dto/createOrderItem.dto';
import { ConverterService } from '../../../components/converter/services/converter.service';
import { CreateOrderDto } from '../dto/createOrder.dto';
import EnqueueOrderResult from '../types/EnqueueOrderResult';

@Injectable()
export class EditorService {
  constructor(
    private readonly ffmpegService: FfmpegService,
    private readonly storageService: StorageService,
    private readonly converterService: ConverterService,
    @InjectRepository(UploadVideoEntity)
    private readonly uploadVideoRepository: Repository<UploadVideoEntity>,
  ) {}

  async enqueueOrder(
    createOrderDto: CreateOrderDto,
  ): Promise<EnqueueOrderResult> {
    const { orderItems } = createOrderDto;

    // 입력된 모든 Video 가 유효한지 확인
    for (const orderItem of orderItems) {
      const { uuid } = orderItem;
      if (await this.isVideoExpired(uuid)) {
        throw new BadRequestException('Invalid video uuid found.');
      }
    }

    // 주문 및 주문 아이템 생성
    const newOrder = await this.converterService.createOrder(createOrderDto);
    const newOrderItems = await this.converterService.createOrderItems(
      newOrder,
      orderItems,
    );

    return {
      orderUUID: newOrder.uuid,
      orderItemIDs: newOrderItems.map((value) => value.id),
    };
  }

  async processUploadedVideo(
    file: Express.Multer.File,
  ): Promise<UploadVideoEntity> {
    const { path, filename, size, mimetype, originalname } = file;

    // 썸네일 이미지, 메타데이터 생성
    const [ffmpegResult, thumbnailFileName] = await Promise.all([
      this.ffmpegService.generateMetadata(path),
      this.ffmpegService.generateThumbnail(path, uuidv4()),
    ]);

    // 동영상과 썸네일 이미지를 업로드
    const [videoUploadResult, thumbnailUrl] = await Promise.all([
      this.storageService.putFileTo(R2Folder.VIDEO_UPLOAD, filename),
      this.storageService.putImageTo(thumbnailFileName),
    ]);

    // 동영상 다운로드 URL 생성
    const videoDownloadUrlResult = await this.storageService.getFileUrl(
      videoUploadResult.key,
    );

    // 임시 파일 삭제
    this.storageService.deleteTmpFile(filename);
    this.storageService.deleteTmpFile(thumbnailFileName);

    // 디비에 업로드 정보 등록
    return this.uploadVideoRepository.save({
      uuid: filename,
      originalVideoName: originalname,
      videoSize: size,
      videoMimetype: mimetype,
      videoDuration: ffmpegResult.duration,
      downloadUrl: videoDownloadUrlResult.url,
      thumbnailUrl,
      expiredAt: videoDownloadUrlResult.expiredAt,
    });
  }

  private async isVideoExpired(uuid: string) {
    const now = new Date();
    const videoNum = await this.uploadVideoRepository.count({
      where: {
        uuid,
        expiredAt: MoreThan(now),
      },
    });

    return videoNum === 0;
  }
}
