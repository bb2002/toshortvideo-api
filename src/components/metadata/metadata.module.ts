import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataEntity } from './entities/metadata.entity';

@Module({
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
  imports: [TypeOrmModule.forFeature([MetadataEntity])],
})
export class MetadataModule {}
