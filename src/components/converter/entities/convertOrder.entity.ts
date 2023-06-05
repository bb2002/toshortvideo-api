import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConvertOrderItemEntity } from './convertOrderItem.entity';
import { ConvertResultItemEntity } from './convertResultItem.entity';

@Entity('tsv_convert_order')
export class ConvertOrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'uuid',
    type: 'varchar',
  })
  @Index('uq_uuid', {
    unique: true,
  })
  uuid: string;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    nullable: true,
  })
  ipAddress: string | null;

  @Column({
    name: 'dequeued_at',
    type: 'datetime',
    nullable: true,
    default: null,
  })
  dequeuedAt: Date | null;

  @OneToMany(() => ConvertOrderItemEntity, (order) => order.order)
  items: ConvertOrderItemEntity[];

  @OneToMany(() => ConvertResultItemEntity, (resultItem) => resultItem.order)
  convertResultItem: ConvertResultItemEntity[];

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
