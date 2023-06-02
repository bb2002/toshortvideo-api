import { forwardRef, Module } from '@nestjs/common';
import { ConverterService } from './services/converter.service';
import { ConvertOrderEntity } from './entities/convertOrder.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditlyService } from './services/editly.service';
import { ConvertOrderItemEntity } from './entities/convertOrderItem.entity';
import { EditorModule } from '../editor/editor.module';

@Module({
  providers: [ConverterService, EditlyService],
  exports: [ConverterService],
  imports: [
    forwardRef(() => EditorModule),
    TypeOrmModule.forFeature([ConvertOrderEntity, ConvertOrderItemEntity]),
  ],
})
export class ConverterModule {}
