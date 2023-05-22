import { Controller, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Controller('storage')
export class StorageController {
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

  @Put()
  @UseInterceptors(FileInterceptor('file'))
  async putFile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.s3
      .putObject({
        Key: `${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        Bucket: 'toshortvideo',
      })
      .promise();

    console.log(result);
    return result;
  }
}
