import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';

@Injectable()
export class StorageService {
  private readonly s3: AWS.S3;

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

  async putFileFromTmpFolder(filename: string): Promise<void> {
    const tmpFile = path.join('tmp', filename);
    if (!this.isFileExists(tmpFile)) {
      throw new InternalServerErrorException('No temporary files were found.');
    }

    await this.s3
      .putObject({
        Bucket: 'toshortvideo',
        Key: path.join('uploadedFiles', filename),
        Body: fs.createReadStream(tmpFile),
      })
      .promise();
  }

  private isFileExists(path: string): boolean {
    try {
      fs.accessSync(path);
      return true;
    } catch (err) {
      return false;
    }
  }
}
