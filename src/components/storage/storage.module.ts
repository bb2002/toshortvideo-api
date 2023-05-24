import { Module, forwardRef } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { MetadataModule } from '../metadata/metadata.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';

@Module({
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
  imports: [
    forwardRef(() => MetadataModule),
    TypeOrmModule.forFeature([FileEntity]),
  ],
})
export class StorageModule {}
