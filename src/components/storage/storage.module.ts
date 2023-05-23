import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { MetadataModule } from '../metadata/metadata.module';

@Module({
  providers: [StorageService],
  controllers: [StorageController],
  imports: [MetadataModule],
})
export class StorageModule {}
