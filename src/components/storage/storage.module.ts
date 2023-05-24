import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { MetadataModule } from '../metadata/metadata.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';

@Module({
  providers: [StorageService],
  controllers: [StorageController],
  imports: [MetadataModule, TypeOrmModule.forFeature([FileEntity])],
})
export class StorageModule {}
