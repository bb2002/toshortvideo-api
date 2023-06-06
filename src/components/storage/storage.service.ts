import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import { addSeconds } from 'date-fns';
import { isFileExists } from '../../common/utils/isFileExists';
import R2Folder from './enums/R2Folder';
import PutFileResult from './types/PutFileResult';
import GetFileResult from './types/GetFileResult';
import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'toshortvideo';
const DOWNLOAD_URL_EXPIRES = 60 * 60 * 24;

@Injectable()
export class StorageService {
  private readonly s3: AWS.S3;
  private readonly logger: Logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
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

  async putFileTo(
    folder: R2Folder,
    filename: string,
    subFolderPath = '',
  ): Promise<PutFileResult> {
    const tmpFile = await this.validateTmpFile(filename);
    const key = path.join(folder, subFolderPath, filename);

    await this.s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fs.createReadStream(tmpFile),
      })
      .promise();

    return {
      folder,
      filename,
      key,
      bucket: BUCKET_NAME,
    };
  }

  async putImageTo(filename: string): Promise<string> {
    const tmpFile = await this.validateTmpFile(filename);

    // TODO Cloudflare Image 등을 연동해서, 압축 후 R2 대신 다른곳에 업로드 해야함
    const key = path.join('thumbnailImages', filename);

    await this.s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fs.createReadStream(tmpFile),
      })
      .promise();

    const downloadUrl = await this.getFileUrl(key);
    return downloadUrl.url;
  }

  async getFileUrl(key: string): Promise<GetFileResult> {
    const signedUrl = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: DOWNLOAD_URL_EXPIRES,
    });

    return {
      url: signedUrl,
      expiredAt: addSeconds(new Date(), DOWNLOAD_URL_EXPIRES),
    };
  }

  async downloadFileToTmp(
    downloadUrl: string,
    downloadFileName = uuidv4(),
  ): Promise<string> {
    const downloadPath = path.join('tmp', downloadFileName);
    const file = fs.createWriteStream(downloadPath);

    return new Promise<string>((resolve, reject) => {
      https
        .get(downloadUrl, (res) => {
          res.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              resolve(downloadPath);
            });
          });
        })
        .on('error', () => {
          fs.unlink(downloadPath, () => {
            reject();
          });
        });
    });
  }

  deleteTmpFile(filename: string) {
    const filePath = path.join('tmp', filename);
    const chunks = filePath.split('/');

    fs.unlink(filePath, (err) => {
      if (err) {
        this.logger.error(err);
      }
    });

    // 디렉터리 삭제도 필요한 경우
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fs.rmdir(path.join(chunks[0], chunks[1]), () => {});
  }

  private async validateTmpFile(filename: string) {
    const tmpFile = path.join('tmp', filename);
    if (!(await isFileExists(tmpFile))) {
      throw new InternalServerErrorException('No temporary files were found.');
    }

    return tmpFile;
  }
}
