import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ExportService } from '../services/export.service';
import { ConverterService } from '../services/converter.service';

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly converterService: ConverterService,
  ) {}

  @Get('/:orderId')
  async getExportResult(@Param('orderId') orderId: string) {
    const order = await this.converterService.getOrder(orderId);
    if (!order) {
      throw new NotFoundException('OrderID is not valid.');
    }
  }
}
