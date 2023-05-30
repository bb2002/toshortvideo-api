import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConvertOrderEntity } from './convertOrder.entity';
import ProgressStatus from '../enums/ProgressStatus';

@Entity('tsv_convert_order_item')
export class ConvertOrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'recipe',
    type: 'text',
  })
  recipe: string;

  @Column({
    name: 'upload_video_uuid',
    type: 'varchar',
  })
  videoUUID: string;

  @Column({
    name: 'progress_status',
    type: 'enum',
    enum: ProgressStatus,
  })
  status: ProgressStatus;

  @Column({
    name: 'progress_rate',
    type: 'int',
    default: 0,
  })
  rate: number;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
  })
  message: string | null;

  @ManyToOne(() => ConvertOrderEntity, (order) => order.items)
  order: ConvertOrderEntity;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    name: 'completed_at',
    type: 'datetime',
    nullable: true,
    default: null
  })
  completedAt: Date | null;
}
