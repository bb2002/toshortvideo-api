import { BadRequestException, Injectable } from '@nestjs/common';
import { EnqueueVideoDto } from '../../editor/dto/enqueueVideo.dto';
import { UploadVideoEntity } from '../../editor/entities/uploadVideo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConvertOrderEntity } from '../entities/convertOrder.entity';
import { Repository } from 'typeorm';
import { ConvertQueueEntity } from '../entities/convertQueue.entity';
import ProgressStatus from '../enums/ProgressStatus';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConverterService {
  constructor(
    @InjectRepository(ConvertOrderEntity)
    private readonly convertOrderRepository: Repository<ConvertOrderEntity>,
    @InjectRepository(ConvertQueueEntity)
    private readonly convertQueueRepository: Repository<ConvertQueueEntity>,
  ) {}

  async createOrder(
    dto: EnqueueVideoDto,
    video: UploadVideoEntity,
  ): Promise<ConvertOrderEntity> {
    const orderCnt = await this.convertOrderRepository.count({
      where: {
        originalVideo: {
          id: video.id,
        },
      },
    });

    if (orderCnt > 0) {
      throw new BadRequestException('Video is already being enqueued');
    }

    return this.convertOrderRepository.save({
      originalVideo: video,
      recipe: JSON.stringify(dto),
      percent: null,
      status: ProgressStatus.WAIT,
    });
  }

  async enqueue(ipAddress: string, orders: ConvertOrderEntity[]) {
    const uuid = uuidv4();

    return this.convertQueueRepository.save({
      ipAddress,
      uuid,
      orders,
    });
  }

  async dequeue(): Promise<ConvertQueueEntity | null> {
    const item = await this.convertQueueRepository.findOne({
      where: {
        dequeuedAt: null,
      },
      order: {
        id: 'ASC',
      },
      relations: ['orders'],
    });

    if (!item) {
      return null;
    }

    // 큐에서 아이템을 뽑았다면, dequeue 처리
    item.dequeuedAt = new Date();
    await this.convertQueueRepository.save(item);

    return item;
  }
}
