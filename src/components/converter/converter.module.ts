import { forwardRef, Module } from '@nestjs/common';
import { ConverterService } from './services/converter.service';
import { ConvertOrderEntity } from './entities/convertOrder.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditlyService } from './services/editly.service';
import { ConvertOrderItemEntity } from './entities/convertOrderItem.entity';
import { EditorModule } from '../editor/editor.module';
import { ExportService } from './services/export.service';
import { StorageModule } from '../storage/storage.module';
import { ConvertResultItemEntity } from './entities/convertResultItem.entity';

@Module({
  providers: [ConverterService, EditlyService, ExportService],
  exports: [ConverterService],
  imports: [
    StorageModule,
    forwardRef(() => EditorModule),
    TypeOrmModule.forFeature([
      ConvertOrderEntity,
      ConvertOrderItemEntity,
      ConvertResultItemEntity,
    ]),
  ],
})
export class ConverterModule {}
