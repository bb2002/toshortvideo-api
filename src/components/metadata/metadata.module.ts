import { Module, forwardRef } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataEntity } from './entities/metadata.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
  imports: [
    forwardRef(() => StorageModule),
    TypeOrmModule.forFeature([MetadataEntity]),
  ],
})
export class MetadataModule {}
