import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConvertOrderEntity } from './convertOrder.entity';

@Entity('tsv_convert_queue')
export class ConvertQueueEntity {
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
  })
  @Index('ix_ip_address')
  ipAddress: string;

  @OneToMany(() => ConvertOrderEntity, (order) => order.queue)
  orders: ConvertOrderEntity[];

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @DeleteDateColumn({
    name: 'dequeued_at',
  })
  dequeuedAt: Date;
}
