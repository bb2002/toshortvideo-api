import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { StorageService } from 'src/components/storage/storage.service';
import { ConvertResultItemEntity } from '../entities/convertResultItem.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadVideoEntity } from 'src/components/editor/entities/uploadVideo.entity';
import { ConvertOrderItemEntity } from '../entities/convertOrderItem.entity';
import { isFileExists } from 'src/common/utils/isFileExists';
import ExportVideoStatus from '../enums/ExportVideoStatus';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import R2Folder from 'src/components/storage/enums/R2Folder';

interface CreateExportParams {
  uploadVideoEntity: UploadVideoEntity;
  orderItemEntity: ConvertOrderItemEntity;
}

interface StartExportParams {
  videoFileName: string;
  resultItem: ConvertResultItemEntity;
}

@Injectable()
export class ExportService {
  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(ConvertResultItemEntity)
    private readonly convertResultItemRepository: Repository<ConvertResultItemEntity>,
  ) {}

  async createExport({
    orderItemEntity,
    uploadVideoEntity,
  }: CreateExportParams) {
    return this.convertResultItemRepository.save({
      downloadUrl: null,
      expiredAt: null,
      order: orderItemEntity,
      originalVideo: uploadVideoEntity,
      status: ExportVideoStatus.WAITING,
    });
  }

  async startExport({ resultItem, videoFileName }: StartExportParams) {
    const videoFilePath = path.join('tmp', videoFileName);
    const processedVideoKey = uuidv4();
    const processedVideoFilePath = path.join(
      processedVideoKey,
      `ToShortVideo_${resultItem.originalVideo.originalVideoName}`,
    );

    // 파일이 존재하는지 확인
    if (!(await isFileExists(videoFilePath))) {
      throw new InternalServerErrorException('Converted video not found.');
    }

    // 업로드 시작
    resultItem.status = ExportVideoStatus.UPLOADING;
    await this.convertResultItemRepository.save(resultItem);
    const { key } = await this.storageService.putFileTo(
      R2Folder.VIDEO_PROCESSED,
      processedVideoFilePath,
    );

    // 다운로드 URL 생성 후 업로드 완료
    const { expiredAt, url } = await this.storageService.getFileUrl(key);
    resultItem.downloadUrl = url;
    resultItem.expiredAt = expiredAt;
    resultItem.status = ExportVideoStatus.DONE;
    await this.convertResultItemRepository.save(resultItem);

    // 임시파일 삭제
    this.storageService.deleteTmpFile(videoFileName);
  }
}
