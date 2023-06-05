import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/components/storage/storage.service';
import { ConvertResultItemEntity } from '../entities/convertResultItem.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadVideoEntity } from 'src/components/editor/entities/uploadVideo.entity';
import ExportVideoStatus from '../enums/ExportVideoStatus';
import * as path from 'path';
import R2Folder from 'src/components/storage/enums/R2Folder';
import { renameTmpFile } from 'src/common/utils/renameFile';
import { ConvertOrderEntity } from '../entities/convertOrder.entity';

interface CreateExportParams {
  uploadVideoEntity: UploadVideoEntity;
  orderEntity: ConvertOrderEntity;
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

  async createExport({ orderEntity, uploadVideoEntity }: CreateExportParams) {
    return this.convertResultItemRepository.save({
      downloadUrl: null,
      expiredAt: null,
      order: orderEntity,
      originalVideo: uploadVideoEntity,
      status: ExportVideoStatus.WAITING,
    });
  }

  async startExport({ resultItem, videoFileName }: StartExportParams) {
    const { uuid, originalVideoName } = resultItem.originalVideo;
    const newVideoFilePath = path.join(
      uuid,
      'ToShortVideo_' +
        path.parse(path.basename(originalVideoName)).name +
        '.mp4',
    );

    // 임시파일의 이름을 업로드할 파일 명으로 변경
    await renameTmpFile(videoFileName, newVideoFilePath);

    // 업로드 시작
    resultItem.status = ExportVideoStatus.UPLOADING;
    await this.convertResultItemRepository.save(resultItem);
    const { key } = await this.storageService.putFileTo(
      R2Folder.VIDEO_PROCESSED,
      newVideoFilePath,
    );

    // 다운로드 URL 생성 후 업로드 완료
    const { expiredAt, url } = await this.storageService.getFileUrl(key);
    resultItem.downloadUrl = url;
    resultItem.expiredAt = expiredAt;
    resultItem.status = ExportVideoStatus.DONE;
    await this.convertResultItemRepository.save(resultItem);

    // 임시파일 삭제
    this.storageService.deleteTmpFile(newVideoFilePath);
  }
}
