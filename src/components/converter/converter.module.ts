import { Module } from '@nestjs/common';
import { ConverterService } from './services/converter.service';
import { ConvertQueueEntity } from './entities/convertQueue.entity';
import { ConvertOrderEntity } from './entities/convertOrder.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditlyService } from './services/editly.service';

@Module({
  providers: [ConverterService, EditlyService],
  exports: [ConverterService],
  imports: [TypeOrmModule.forFeature([ConvertOrderEntity, ConvertQueueEntity])],
})
export class ConverterModule {}
