import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderItemDto } from '../../editor/dto/createOrderItem.dto';
import { UploadVideoEntity } from '../../editor/entities/uploadVideo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConvertOrderEntity } from '../entities/convertOrder.entity';
import { Repository } from 'typeorm';
import ProgressStatus from '../enums/ProgressStatus';
import { v4 as uuidv4 } from 'uuid';
import { ConvertOrderItemEntity } from '../entities/convertOrderItem.entity';
import { CreateOrderDto } from '../../editor/dto/createOrder.dto';

@Injectable()
export class ConverterService {
  constructor(
    @InjectRepository(ConvertOrderEntity)
    private readonly convertOrderRepository: Repository<ConvertOrderEntity>,
    @InjectRepository(ConvertOrderItemEntity)
    private readonly convertOrderItemEntityRepository: Repository<ConvertOrderItemEntity>,
  ) {}

  async createOrderItems(
    order: ConvertOrderEntity,
    createOrderItemDto: CreateOrderItemDto[],
  ) {
    return this.convertOrderItemEntityRepository.save(
      createOrderItemDto.map((dto) => ({
        recipe: JSON.stringify(dto.recipe),
        videoUUID: dto.uuid,
        status: ProgressStatus.WAIT,
        order,
      })),
    );
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
  ): Promise<ConvertOrderEntity> {
    const { ipAddress } = createOrderDto;

    return this.convertOrderRepository.save({
      uuid: uuidv4(),
      ipAddress,
    });
  }

  //
  // async getOrderById(id: number): Promise<ConvertOrderEntity | null> {
  //   return this.convertOrderRepository.findOne({
  //     where: {
  //       id,
  //     },
  //     relations: ['originalVideo'],
  //   });
  // }
  //
  // async enqueue(ipAddress: string, orders: ConvertOrderEntity[]) {
  //   const uuid = uuidv4();
  //
  //   return this.convertQueueRepository.save({
  //     ipAddress,
  //     uuid,
  //     orders,
  //   });
  // }
  //
  // async dequeue(): Promise<ConvertQueueEntity | null> {
  //   const item = await this.convertQueueRepository.findOne({
  //     where: {
  //       dequeuedAt: null,
  //     },
  //     order: {
  //       id: 'ASC',
  //     },
  //     relations: ['orders'],
  //   });
  //
  //   if (!item) {
  //     return null;
  //   }
  //
  //   // 큐에서 아이템을 뽑았다면, dequeue 처리
  //   item.dequeuedAt = new Date();
  //   await this.convertQueueRepository.save(item);
  //
  //   return item;
  // }
}
