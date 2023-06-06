import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderItemDto } from '../../editor/dto/createOrderItem.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ConvertOrderEntity } from '../entities/convertOrder.entity';
import { IsNull, LessThan, Repository } from 'typeorm';
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

  async dequeueOrder() {
    const order = await this.convertOrderRepository.findOne({
      where: {
        dequeuedAt: IsNull(),
      },
      order: {
        id: 'ASC',
      },
      relations: ['items'],
    });

    if (order) {
      order.dequeuedAt = new Date();
      await this.convertOrderRepository.save(order);
      return order;
    }

    return null;
  }

  async getOrder(uuid: string): Promise<ConvertOrderEntity | null> {
    return this.convertOrderRepository.findOne({
      where: {
        uuid,
      },
      relations: ['items', 'convertResultItem'],
    });
  }

  async getOrderCountBefore(uuid: string) {
    const order = await this.getOrder(uuid);
    if (!order) {
      throw new NotFoundException('OrderID is not valid.');
    }

    return this.convertOrderRepository.count({
      where: {
        id: LessThan(order.id),
        dequeuedAt: IsNull(),
      },
    });
  }
}
