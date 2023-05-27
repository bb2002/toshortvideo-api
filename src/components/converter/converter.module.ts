import { Module } from '@nestjs/common';
import { ConverterService } from './converter.service';
import { ConvertQueueEntity } from './entities/convertQueue.entity';
import { ConvertOrderEntity } from './entities/convertOrder.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [ConverterService],
  exports: [ConverterService],
  imports: [TypeOrmModule.forFeature([ConvertOrderEntity, ConvertQueueEntity])],
})
export class ConverterModule {}
