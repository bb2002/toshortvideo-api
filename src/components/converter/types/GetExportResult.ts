import ProgressStatus from '../../../components/converter/enums/ProgressStatus';
import ExportVideoStatus from '../enums/ExportVideoStatus';

interface OrderResult {
  dequeuedAt: Date | null;
  beforeOrderCount: number;
}

interface ExportingResult {
  status: ExportVideoStatus;
  downloadUrl: string | null;
  expiredAt: Date | null;
}

interface OrderItemResult {
  originalName: string;
  status: ProgressStatus;
  rate: number;
  export?: ExportingResult;
}

interface GetExportResult {
  order: OrderResult;
  items: OrderItemResult[];
}

export default GetExportResult;
