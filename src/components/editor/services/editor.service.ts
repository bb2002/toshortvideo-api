import { BadRequestException, Injectable } from '@nestjs/common';
import { FfmpegService } from './ffmpeg.service';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../../storage/storage.service';
import R2Folder from '../../storage/enums/R2Folder';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadVideoEntity } from '../entities/uploadVideo.entity';
import { In, MoreThan, Repository } from 'typeorm';
import { EnqueueVideoDto } from '../dto/enqueueVideo.dto';
import { ConverterService } from 'src/components/converter/converter.service';

@Injectable()
export class EditorService {
  constructor(
    private readonly ffmpegService: FfmpegService,
    private readonly storageService: StorageService,
    private readonly converterService: ConverterService,
    @InjectRepository(UploadVideoEntity)
    private readonly uploadVideoRepository: Repository<UploadVideoEntity>,
  ) {}

  async enqueueVideos(ipAddress: string, enqueueVideoDto: EnqueueVideoDto[]) {
    if (enqueueVideoDto.length > 5) {
      throw new BadRequestException('Maximum 5 videos can be enqueued.');
    }

    const now = new Date();
    const uploadedVideos = await this.uploadVideoRepository.find({
      where: {
        uuid: In(enqueueVideoDto.map((video) => video.uuid)),
        expiredAt: MoreThan(now),
      },
    });

    if (enqueueVideoDto.length !== uploadedVideos.length) {
      throw new BadRequestException('Invalid video uuid found.');
    }

    const convertOrders = await Promise.all(
      enqueueVideoDto.map((dto) => {
        const video = uploadedVideos.find((value) => value.uuid === dto.uuid);

        return this.converterService.createOrder(dto, video);
      }),
    );

    return this.converterService.enqueue(ipAddress, convertOrders);
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
}
