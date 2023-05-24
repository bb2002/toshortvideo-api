import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import isFileExists from '../../common/utils/isFileExists';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { Repository } from 'typeorm';
import { RegisterFileDto } from './dto/registerFile.dto';
import { addSeconds } from 'date-fns';
import { UpdateFileDto } from './dto/updateFileDto';
import { isUndefined } from '@nestjs/common/utils/shared.utils';

interface UploadFileToStorageResult {
  key: string;
  bucket: string;
}

interface GenerateDownloadUrlResult {
  url: string;
  expiredAt: Date;
}

@Injectable()
export class StorageService {
  private readonly s3: AWS.S3;
  private readonly BUCKET_NAME = 'toshortvideo';
  private readonly DOWNLOAD_URL_EXPIRES = 60 * 60 * 24; // 1Day

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {
    const accountId = this.configService.get('ACCOUNT_ID');
    const accessKeyId = this.configService.get('ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('SECRET_ACCESS_KEY');

    this.s3 = new AWS.S3({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      signatureVersion: 'v4',
    });
  }

  async registerFile(registerFileDto: RegisterFileDto) {
    const { uuid, originalName, mimeType, fileSize, downloadUrl, expiredAt } =
      registerFileDto;

    return this.fileRepository.save({
      uuid,
      originalName,
      mimeType,
      fileSize,
      ...(!isUndefined(downloadUrl) ? { downloadUrl } : {}),
      ...(!isUndefined(expiredAt) ? { expiredAt } : {}),
    });
  }

  async updateFile(updateFileDto: UpdateFileDto) {
    const { uuid, downloadUrl, expiredAt } = updateFileDto;

    return this.fileRepository.update(
      {
        uuid,
      },
      {
        ...(!isUndefined(downloadUrl) ? { downloadUrl } : {}),
        ...(!isUndefined(expiredAt) ? { expiredAt } : {}),
      },
    );
  }

  async uploadFileToStorage(
    filename: string,
  ): Promise<UploadFileToStorageResult> {
    const tmpFile = path.join('tmp', filename);
    if (!isFileExists(tmpFile)) {
      throw new InternalServerErrorException('No temporary files were found.');
    }

    const key = path.join('uploadedFiles', filename);

    await this.s3
      .putObject({
        Bucket: this.BUCKET_NAME,
        Key: key,
        Body: fs.createReadStream(tmpFile),
      })
      .promise();

    return {
      key,
      bucket: this.BUCKET_NAME,
    };
  }

  async generateDownloadUrl(key: string): Promise<GenerateDownloadUrlResult> {
    const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.BUCKET_NAME,
      Key: key,
      Expires: this.DOWNLOAD_URL_EXPIRES,
    });

    return {
      url: signedUrl,
      expiredAt: addSeconds(new Date(), this.DOWNLOAD_URL_EXPIRES),
    };
  }
}
