import { Controller, Get } from '@nestjs/common';
import { MetadataService } from './metadata.service';

@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('test')
  async test() {
    await this.metadataService.getVideoDuration('tmp/asdfasdf');
    await this.metadataService.getVideoThumbnail('tmp/asdfasdf');
  }
}
