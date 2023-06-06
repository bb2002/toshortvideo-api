import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ExportService } from '../services/export.service';
import { ConverterService } from '../services/converter.service';
import GetExportResult from '../types/GetExportResult';
import { EditorService } from 'src/components/editor/services/editor.service';

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportSerivce: ExportService,
    private readonly converterService: ConverterService,
    private readonly editorService: EditorService,
  ) {}

  @Get('/:orderId')
  async getExportResult(
    @Param('orderId') orderId: string,
  ): Promise<GetExportResult> {
    const order = await this.converterService.getOrder(orderId);
    if (!order) {
      throw new NotFoundException('OrderID is not valid.');
    }

    const beforeOrderCount = await this.converterService.getOrderCountBefore(
      orderId,
    );
    const { items, dequeuedAt } = order;

    return {
      order: {
        beforeOrderCount,
        dequeuedAt,
      },
      items: await Promise.all(
        items.map(async (item) => {
          const { videoUUID } = item;
          const uploadedVideo = await this.editorService.getUploadVideo(
            videoUUID,
          );
          const resultItem = await this.exportSerivce.getResultItem(
            uploadedVideo,
          );

          return {
            originalName: uploadedVideo.originalVideoName,
            status: item.status,
            rate: item.rate,
            export: resultItem
              ? {
                  status: resultItem.status,
                  downloadUrl: resultItem.downloadUrl,
                  expiredAt: resultItem.expiredAt,
                }
              : undefined,
          };
        }),
      ),
    };
  }
}
